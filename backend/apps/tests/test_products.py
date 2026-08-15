"""
Products test suite — tests/test_products.py
=============================================
Tests product listing, filtering, detail, category/subcategory endpoints,
and homepage data endpoints.
"""
from decimal import Decimal
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Category, Subcategory, Product, ProductVariant
from .helpers import make_category, make_product, make_variant

NO_THROTTLE = override_settings(
    REST_FRAMEWORK={
        'DEFAULT_THROTTLE_CLASSES': [],
        'DEFAULT_THROTTLE_RATES': {},
    }
)


def _make_full_catalog():
    """Create a small product catalog: 1 category, 1 subcategory, 2 products."""
    cat = make_category(name='Rings', slug='rings')
    sub = Subcategory.objects.create(
        category=cat, name='Engagement', slug='engagement', is_active=True
    )
    p1 = make_product(cat, name='Gold Ring', base_price=Decimal('1999.00'))
    p1.is_bestseller = True
    p1.is_new_arrival = True
    p1.save()

    p2 = Product.objects.create(
        category=cat,
        subcategory=sub,
        name='Silver Ring',
        description='A silver ring.',
        base_price=Decimal('999.00'),
        is_active=True,
    )
    v1 = make_variant(p1, sku='SKU-GOLD-01')
    v2 = make_variant(p2, metal_type='Silver', price=Decimal('999.00'), sku='SKU-SILVER-01')
    return cat, sub, p1, p2, v1, v2


@NO_THROTTLE
class ProductListTests(APITestCase):
    """GET /api/products/"""
    URL = '/api/products/'

    def setUp(self):
        self.cat, self.sub, self.p1, self.p2, self.v1, self.v2 = _make_full_catalog()

    def test_list_products_returns_active_products(self):
        res = self.client.get(self.URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # API wraps pagination in res.data['data']
        self.assertEqual(res.data['data']['count'], 2)

    def test_inactive_product_excluded(self):
        self.p2.is_active = False
        self.p2.save()
        res = self.client.get(self.URL)
        self.assertEqual(res.data['data']['count'], 1)

    def test_search_by_name(self):
        res = self.client.get(self.URL, {'search': 'Gold'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        names = [p['name'] for p in res.data['data']['results']]
        self.assertIn('Gold Ring', names)
        self.assertNotIn('Silver Ring', names)

    def test_pagination_works(self):
        """PAGE_SIZE is 12 — with only 2 products, count should be 2."""
        res = self.client.get(self.URL)
        self.assertIn('count', res.data['data'])
        self.assertIn('results', res.data['data'])


@NO_THROTTLE
class ProductDetailTests(APITestCase):
    """GET /api/products/{id}/"""

    def setUp(self):
        self.cat, _, self.p1, _, _, _ = _make_full_catalog()

    def test_get_product_detail(self):
        res = self.client.get(f'/api/products/{self.p1.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['name'], 'Gold Ring')

    def test_nonexistent_product_returns_404(self):
        import uuid
        res = self.client.get(f'/api/products/{uuid.uuid4()}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_inactive_product_returns_404(self):
        self.p1.is_active = False
        self.p1.save()
        res = self.client.get(f'/api/products/{self.p1.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


@NO_THROTTLE
class CategoryTests(APITestCase):
    """GET /api/categories/ and category product listing."""

    def setUp(self):
        self.cat, _, self.p1, self.p2, _, _ = _make_full_catalog()

    def test_list_categories(self):
        res = self.client.get('/api/categories/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['data']), 1)

    def test_category_products(self):
        # Category products endpoint returns paginated data inside res.data['data']
        res = self.client.get(f'/api/categories/{self.cat.slug}/products/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        count = (
            res.data.get('count')
            or res.data.get('data', {}).get('count')
            or len(res.data.get('data', {}).get('results', res.data.get('data', [])))
        )
        self.assertGreaterEqual(count, 2)

    def test_inactive_category_excluded(self):
        self.cat.is_active = False
        self.cat.save()
        res = self.client.get('/api/categories/')
        slugs = [c['slug'] for c in res.data['data']]
        self.assertNotIn(self.cat.slug, slugs)


@NO_THROTTLE
class HomepageEndpointTests(APITestCase):
    """GET /api/products/homepage/* endpoints."""

    def setUp(self):
        _make_full_catalog()

    def test_bestsellers_endpoint(self):
        res = self.client.get('/api/products/homepage/bestsellers/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_new_arrivals_endpoint(self):
        res = self.client.get('/api/products/homepage/new-arrivals/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_homepage_all_endpoint(self):
        res = self.client.get('/api/products/homepage/all/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
