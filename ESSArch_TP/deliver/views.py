#!/usr/bin/env /ESSArch/python27/bin/python
# -*- coding: UTF-8 -*-
'''
    ESSArch Tools - ESSArch is an Electronic Preservation Platform
    Copyright (C) 2005-2013  ES Solutions AB

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

    Contact information:
    Web - http://www.essolutions.se
    Email - essarch@essolutions.se
'''

# Create your views here.
from django.template import Context, loader
from django.template import RequestContext 
from django.http import HttpResponse, HttpResponseRedirect
from django.core.context_processors import csrf
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response, get_object_or_404
import datetime, shutil, os.path, uuid, forms, httplib
from django.core.mail import send_mail, EmailMessage
from django.conf import settings

# import the logging library and get an instance of a logger
import logging
logger = logging.getLogger('code.exceptions')

# own models etc
from configuration.models import Path, Parameter, SchemaProfile
from ip.models import InformationPackage
import lib.utils as lu
import lib.app_tools as lat
from esscore.rest.uploadchunkedrestclient import UploadChunkedRestClient, UploadChunkedRestException
import requests
import  requests.packages
from urlparse import urljoin
import jsonpickle
from requests.auth import HTTPBasicAuth

@login_required
def index(request):
    # Get current site_profile and zone
    site_profile, zone = lat.getSiteZone()
    if zone == 'zone1' : 
        objs = InformationPackage.objects.filter(state='Created')
        t = loader.get_template('deliver/index.html')
        c = RequestContext(request)
        c['informationpackages'] = objs
        c['zone'] = zone
        return HttpResponse(t.render(c))
    return HttpResponseRedirect( '/' )


"Move IP from source to destination"
###############################################
@login_required
def deliverip(request, id):
    ip = get_object_or_404(InformationPackage, pk=id)

    #url = '/ESSArch/Tools/env' 
    #response.geturl() # get url
    #fn = url.split('/')[1] # get filename in url
    #print fn


    # Get current site_profile and zone
    site_profile, zone = lat.getSiteZone()

    # need to find out path for source and destination
    destination = Path.objects.get(entity="path_ingest_reception").value
    
    if request.method == 'POST': # If the form has been submitted...
        form = forms.DeliverForm(request.POST) # A form bound to the POST data
        if form.is_valid(): # All validation rules pass
            
            # which package description file and compressed IP file
            f_name = ip.directory + '/' + Parameter.objects.get(entity="package_descriptionfile").value
            ip_fname = ip.directory + '/' + ip.uuid+'.tar'
            
            # get clean context data from form
            contextdata = form.cleaned_data
            #destination = contextdata['destination']
                        
            # move ip from source to destination
            dir_src = ip.directory

            remote_server_string = Parameter.objects.get(entity='preservation_organization_receiver').value
            remote_server = remote_server_string.split(',')
            if len(remote_server) == 3:
                remote_flag = True
            else:
                remote_flag = False

            if remote_flag:
                # init uploadclient
                base_url, ruser, rpass = remote_server
                upload_rest_endpoint = urljoin(base_url, '/api/create_reception_upload')        
                requests_session =  _initialize_requests_session(ruser, rpass, cert_verify=False, disable_warnings=True)           
                uploadclient = UploadChunkedRestClient(requests_session, upload_rest_endpoint)
            else:
                # Create a new information package folder ready for deliver
                i = 1
                while os.path.exists( os.path.join( destination, "ip%d"%i ) ):
                    i+=1
                delivery_root = os.path.join( destination, "ip%d"%i )
                os.makedirs( delivery_root )          
                dir_dst = delivery_root+'/'      
            
            for filename in os.listdir(dir_src):
                
                src_file = os.path.join(dir_src, filename)
                if remote_flag:
                    uploadclient.upload(src_file, ip.uuid)
                else:
                    dst_file = os.path.join(dir_dst, filename)
                    #shutil.move(src_file, dst_file)
                    shutil.copy(src_file, dst_file)
            logger.info('Successfully delivered package IP %s to destination', ip.label )
            
            # remove source directory
            #shutil.rmtree(ip.directory)

            # mark IP as delivered
            ip.state = "Submitted"
            if not remote_flag:
                ip.directory = delivery_root 
            ip.progress = 100
            ip.save()

            # email parameters
            email_subject = contextdata['email_subject']
            email_body = contextdata['email_body']
            email_to = contextdata['email_to'] 
            email_from = str(request.user.email) # logged in user

            logger.info('send_mail of package description %s starts' % f_name)
            
            # create and send email with attached package description file            
            msg = EmailMessage(email_subject, email_body, email_from, [email_to])
            msg.attach_file(f_name, 'application/xml')
            msg.send(fail_silently=False)
            
            logger.info('send_mail of package description %s ends' % f_name)
        
            return HttpResponseRedirect( '/deliver' )
        else:
            logger.error('Form DeliverForm is not valid.')
            #print form.data, form.errors
            c = {'form': form,
                 'zone':zone,
                 'ip':ip, 
                 }
            c.update(csrf(request))
            return render_to_response('deliver/deliver.html', c, context_instance=RequestContext(request) )
    else:
        remote_server_string = Parameter.objects.get(entity='preservation_organization_receiver').value
        remote_server = remote_server_string.split(',')
        if len(remote_server) == 3:
            remote_flag = True
        else:
            remote_flag = False

        if remote_flag:
            # init uploadclient
            base_url, ruser, rpass = remote_server
            preservation_organization_receiver = '- Remote server: %s' % base_url
        else:
            preservation_organization_receiver = '- Local filesystem: %s' % destination

        initialvalues = {}
        #initialvalues = IPParameter.objects.all().values()[0]
        #initialvalues['username'] = str(request.user)
        #initialvalues['password'] = request.user.password
        initialvalues['preservation_organization_receiver'] = preservation_organization_receiver
        initialvalues['email_from'] = str(request.user.email) # logged in user
        initialvalues['email_to'] = Parameter.objects.get(entity='preservation_email_receiver').value # default email receiver
        initialvalues['destination'] = destination
        form = forms.DeliverForm( initial=initialvalues )

    c = {'form': form,
         'zone':zone,
         'ip':ip,
         'sourceroot':ip.directory
         }
    c.update(csrf(request))
    return render_to_response('deliver/deliver.html', c, context_instance=RequestContext(request) )


def _initialize_requests_session(ruser, rpass, cert_verify=True, disable_warnings=False):
    if disable_warnings == True:
        from requests.packages.urllib3.exceptions import InsecureRequestWarning, InsecurePlatformWarning
        requests.packages.urllib3.disable_warnings(InsecurePlatformWarning)
        requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    requests_session = requests.Session()
    requests_session.verify = cert_verify
    requests_session.auth = (ruser, rpass)
    return requests_session

'''
def _custom_progress_reporter(percent):
    logger.info('\rUpload file: progress:%s percent' % (percent))
'''

@login_required
def sendfile(request, filename):
    from django.utils.encoding import smart_str

    ##set path and filename
    resource_path = settings.RESOURCES_DIR # resource dir ie /workspace/y/src/y/media
    #resource_path = settings.RESOURCES_DIR # resource dir ie /workspace/y/src/y/media
    #filename = "sleep_away.mp3" #file to be served 

    ##add it to os.path  
    filepath = os.path.join(resource_path,"audio",filename)
    print "complete file path: ", filepath     

    ##filewrapper to server in size of 8kb each until whole file is served   
    #file_wrapper = FileWrapper(file(filepath,'rb')) ##windows needs rb (read binary) for non text files   

    ##get file mimetype
    #file_mimetype = mimetypes.guess_type(filepath)

    ##create response with file_mimetype and file_wrapper      
    #response = HttpResponse(content_type=file_mimetype, file_wrapper)

    ##set X-sendfile header with filepath
    #response['X-Sendfile'] = filepath ##no need for smart_str here.

    ##get filesize
    #print "sendfile size", os.stat(filepath).st_size
    #response['Content-Length'] = os.stat(filepath).st_size ##set content length    
    #response['Content-Disposition'] = 'attachment; filename=%s/' % smart_str(filename) ##set disposition     

    #return response ## all done, hurray!! return response :)