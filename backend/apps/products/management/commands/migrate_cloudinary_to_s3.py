import mimetypes
import os
import re
from dataclasses import dataclass
from urllib.parse import quote, unquote, urlparse

import boto3
import requests
from botocore.exceptions import ClientError
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connections, transaction

from apps.products.models import Category, HeroSlider, InstagramPost, ProductImage, Subcategory


@dataclass
class ImageAsset:
    label: str
    pk: str
    field: str
    value: str
    key: str
    source_url: str
    raw_table: str = ''


class Command(BaseCommand):
    help = "Copy existing Cloudinary media files to S3 and normalize image DB fields."

    model_fields = (
        (Category, "image"),
        (Subcategory, "image"),
        (ProductImage, "image"),
        (HeroSlider, "image"),
        (HeroSlider, "mobile_image"),
        (InstagramPost, "image"),
    )

    def add_arguments(self, parser):
        parser.add_argument("--commit", action="store_true", help="Upload files and update DB fields.")
        parser.add_argument("--database", default="default", help="Django database alias to update.")
        parser.add_argument("--limit", type=int, default=0, help="Limit processed assets for a smoke test.")
        parser.add_argument(
            "--cloudinary-cloud-name",
            default="",
            help="Cloudinary cloud name. Defaults to CLOUDINARY_CLOUD_NAME if set.",
        )
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Upload to S3 even when the object already exists.",
        )

    def handle(self, *args, **options):
        bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "")
        if not bucket:
            raise CommandError("AWS_STORAGE_BUCKET_NAME is required.")

        cloud_name = options["cloudinary_cloud_name"] or os.environ.get("CLOUDINARY_CLOUD_NAME", "")
        if not cloud_name:
            raise CommandError(
                "Cloudinary cloud name is required because the database stores Cloudinary public IDs. "
                "Pass --cloudinary-cloud-name or set CLOUDINARY_CLOUD_NAME."
            )
        self.cloud_name = cloud_name

        database = options["database"]
        connection = connections[database]
        assets = list(self.iter_assets(connection, database))
        if options["limit"]:
            assets = assets[: options["limit"]]

        if not assets:
            self.stdout.write(self.style.SUCCESS("No image fields found to migrate."))
            return

        s3 = (
            boto3.client("s3", region_name=getattr(settings, "AWS_S3_REGION_NAME", "") or None)
            if options["commit"] else None
        )
        uploaded = 0
        skipped = 0
        rewritten = 0
        failed = 0

        self.stdout.write(
            f"{'COMMIT' if options['commit'] else 'DRY RUN'}: {len(assets)} image field(s), bucket={bucket}"
        )

        with transaction.atomic(using=database):
            for asset in assets:
                s3_key = self.s3_key(asset.key)

                if not options["commit"]:
                    uploaded += 1
                elif self.s3_exists(s3, bucket, s3_key) and not options["overwrite"]:
                    skipped += 1
                else:
                    try:
                        body, content_type = self.download(asset.source_url, asset.key)
                        put_kwargs = {
                            "Bucket": bucket,
                            "Key": s3_key,
                            "Body": body,
                            "ContentType": content_type,
                            "CacheControl": settings.AWS_S3_OBJECT_PARAMETERS.get("CacheControl"),
                        }
                        s3.put_object(**{k: v for k, v in put_kwargs.items() if v})
                        uploaded += 1
                    except Exception as exc:
                        failed += 1
                        self.stderr.write(f"FAILED {asset.label}.{asset.field} {asset.pk}: {exc}")
                        continue

                if asset.value != asset.key:
                    rewritten += 1
                    if options["commit"]:
                        self.update_asset(connection, database, asset)

            if not options["commit"]:
                transaction.set_rollback(True, using=database)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. uploaded={uploaded}, skipped_existing={skipped}, db_rewrites={rewritten}, failed={failed}"
            )
        )
        if not options["commit"]:
            self.stdout.write("Dry run only. Re-run with --commit to write to S3/database.")

    def iter_assets(self, connection, database):
        for model, field_name in self.model_fields:
            qs = (
                model._default_manager.using(database)
                .exclude(**{field_name: ""})
                .exclude(**{f"{field_name}__isnull": True})
                .only("pk", field_name)
            )
            for obj in qs.iterator():
                value = str(getattr(obj, field_name) or "").strip()
                if not value:
                    continue
                key = self.cloudinary_key(value)
                yield ImageAsset(
                    label=model.__name__,
                    pk=str(obj.pk),
                    field=field_name,
                    value=value,
                    key=key,
                    source_url=self.cloudinary_url(value, key),
                )

        if "promotional_banners" in connection.introspection.table_names():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, image FROM promotional_banners WHERE image IS NOT NULL AND image <> ''"
                )
                for pk, value in cursor.fetchall():
                    value = str(value).strip()
                    key = self.cloudinary_key(value)
                    yield ImageAsset(
                        label="promotional_banners",
                        pk=str(pk),
                        field="image",
                        value=value,
                        key=key,
                        source_url=self.cloudinary_url(value, key),
                        raw_table="promotional_banners",
                    )

    def update_asset(self, connection, database, asset):
        if asset.raw_table:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"UPDATE {asset.raw_table} SET {asset.field} = %s WHERE id = %s",
                    [asset.key, asset.pk],
                )
            return

        for model, field_name in self.model_fields:
            if model.__name__ == asset.label and field_name == asset.field:
                model._default_manager.using(database).filter(pk=asset.pk).update(**{field_name: asset.key})
                return

    def cloudinary_key(self, value):
        parsed = urlparse(value)
        if parsed.scheme and parsed.netloc:
            parts = [unquote(part) for part in parsed.path.split("/") if part]
            if "upload" in parts:
                parts = parts[parts.index("upload") + 1 :]
            while parts and not re.fullmatch(r"v\d+", parts[0]) and self.looks_like_transformation(parts[0]):
                parts = parts[1:]
            if parts and re.fullmatch(r"v\d+", parts[0]):
                parts = parts[1:]
            return "/".join(parts).lstrip("/")
        return value.lstrip("/")

    def cloudinary_url(self, value, key):
        parsed = urlparse(value)
        if parsed.scheme and parsed.netloc:
            return value
        quoted_key = "/".join(quote(part) for part in key.split("/"))
        return f"https://res.cloudinary.com/{self.cloud_name}/image/upload/{quoted_key}"

    def s3_key(self, key):
        location = getattr(settings, "AWS_LOCATION", "").strip("/")
        return f"{location}/{key}" if location else key

    def s3_exists(self, s3, bucket, key):
        try:
            s3.head_object(Bucket=bucket, Key=key)
            return True
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code")
            if code in {"404", "NoSuchKey", "NotFound"}:
                return False
            raise

    def download(self, source_url, key):
        response = requests.get(source_url, timeout=60)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type") or mimetypes.guess_type(key)[0] or "application/octet-stream"
        return response.content, content_type

    def looks_like_transformation(self, part):
        return "," in part or "_" in part and part.split("_", 1)[0] in {
            "a",
            "ar",
            "b",
            "bo",
            "c",
            "co",
            "d",
            "e",
            "f",
            "fl",
            "g",
            "h",
            "l",
            "o",
            "q",
            "r",
            "t",
            "w",
            "x",
            "y",
            "z",
        }
