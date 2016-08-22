"""etp URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth import views as auth_views

from rest_framework import routers
from preingest import views

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'archive-objects', views.ArchiveObjectViewSet)
router.register(r'steps', views.ProcessStepViewSet)
router.register(r'tasks', views.ProcessTaskViewSet)
router.register(r'events', views.EventViewSet)
router.register(r'event-types', views.EventTypeViewSet)

urlpatterns = [
    url(r'^', include('frontend.urls'), name='home'),
    url(r'^preingest/', include('preingest.urls')),
    url(r'^admin/', admin.site.urls),
    url(r'^api/', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^template/', include('templateMaker.urls')),
    url(r'^accounts/login/$', auth_views.login),
]
