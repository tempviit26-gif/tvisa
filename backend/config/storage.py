import io
import logging

from django.core.files.base import ContentFile
from PIL import Image

try:
    from storages.backends.s3 import S3Storage
except ImportError:  # django-storages < 1.14 compatibility
    from storages.backends.s3boto3 import S3Boto3Storage as S3Storage

logger = logging.getLogger(__name__)


class JPEGS3Storage(S3Storage):
    """
    Converts uploaded images to JPEG before saving them to S3.

    The conversion keeps media uploads small and consistent while still
    falling back to the original file if Pillow cannot parse the upload.
    """

    QUALITY = 85

    def _open(self, name, mode="rb"):
        return super()._open(name, mode)

    def _save(self, name, content):
        """Convert image uploads to JPEG, then delegate persistence to S3."""
        try:
            content.seek(0)
            image = Image.open(content)
            image.load()

            if image.mode in ("RGBA", "P", "LA"):
                background = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "P":
                    image = image.convert("RGBA")
                background.paste(image, mask=image.split()[-1] if image.mode in ("RGBA", "LA") else None)
                image = background
            elif image.mode != "RGB":
                image = image.convert("RGB")

            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=self.QUALITY, optimize=True)
            buffer.seek(0)

            if not name.lower().endswith((".jpg", ".jpeg")):
                base = name.rsplit(".", 1)[0]
                name = f"{base}.jpg"

            content = ContentFile(buffer.getvalue())

        except Exception:
            logger.warning(
                "JPEGS3Storage: failed to convert image to JPEG; uploading original file.",
                exc_info=True,
            )
            content.seek(0)

        return super()._save(name, content)
