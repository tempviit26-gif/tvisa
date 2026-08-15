from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from .models import Wishlist
from .serializers import WishlistSerializer
from apps.products.models import ProductImage

def get_wishlist_identifier(request):
    if request.user.is_authenticated:
        return {'user': request.user}
    
    guest_id = request.headers.get('X-Guest-ID')
    if not guest_id:
        return None
    return {'guest_id': guest_id}


def api_response(data=None, message='Success', success=True, status_code=status.HTTP_200_OK):
    return Response({'success': success, 'data': data, 'message': message}, status=status_code)


def api_error(error='An error occurred', details=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'error': error, 'details': details or {}}, status=status_code)


class WishlistListView(APIView):
    """GET /api/wishlist/ — List user's or guest's wishlist."""
    permission_classes = [AllowAny]

    def get(self, request):
        identifier = get_wishlist_identifier(request)
        if not identifier:
            return api_response([])
            
        items = Wishlist.objects.filter(**identifier).select_related(
            'product__category', 'product__subcategory'
        ).prefetch_related(
            Prefetch(
                'product__images',
                queryset=ProductImage.objects.order_by('display_order'),
            )
        )
        serializer = WishlistSerializer(items, many=True)
        return api_response(serializer.data)


class WishlistAddView(APIView):
    """POST /api/wishlist/add/ — Add product to wishlist."""
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = get_wishlist_identifier(request)
        if not identifier:
            return api_error('Unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
            
        # We need to manually validate since the serializer expects a User in context if we rely on its defaults
        product_id = request.data.get('product')
        if not product_id:
            return api_error('Product ID is required')
            
        if Wishlist.objects.filter(**identifier, product_id=product_id).exists():
            return api_error('Product already in wishlist')

        # Since we modified the model, we can just create it directly
        wishlist_item = Wishlist.objects.create(**identifier, product_id=product_id)
        
        # Reload to get related fields for the serializer
        wishlist_item = Wishlist.objects.select_related('product__category', 'product__subcategory').get(pk=wishlist_item.pk)
        
        serializer = WishlistSerializer(wishlist_item)
        return api_response(serializer.data, 'Added to wishlist', status_code=status.HTTP_201_CREATED)


class WishlistRemoveView(APIView):
    """DELETE /api/wishlist/{id}/ — Remove from wishlist."""
    permission_classes = [AllowAny]

    def delete(self, request, pk):
        identifier = get_wishlist_identifier(request)
        if not identifier:
            return api_error('Unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
            
        item = get_object_or_404(Wishlist, pk=pk, **identifier)
        item.delete()
        return api_response(message='Removed from wishlist')
