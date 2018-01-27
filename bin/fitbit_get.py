from multiprocessing import Process
from signal import signal, SIGTERM
from time import sleep
import atexit
import requests
import os
import urllib
import urllib2
import time
import splunk.clilib.cli_common
import json
import sys
import splunk.rest
import re
import logging
import logging.handlers

class Unbuffered:
    def __init__(self, stream):
        self.stream = stream

    def write(self, data):
        self.stream.write(data)
        self.stream.flush()

    def __getattr__(self, attr):
        return getattr(self.stream, attr)

def setup_logger(level):
    logger = logging.getLogger('my_search_command')
    logger.propagate = False  # Prevent the log messages from being duplicated in the python.log file
    logger.setLevel(level)

    file_handler = logging.handlers.RotatingFileHandler(
        os.environ['SPLUNK_HOME'] + '/var/log/splunk/fitbit.log', maxBytes=25000000, backupCount=5)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

    return logger

logger = setup_logger(logging.INFO)
#logger.info("Let's Begin")

sys.stdout = Unbuffered(sys.stdout)
sys.stdout.flush()

#Just grab some Splunk Environment Info and log it
splunk_home = os.path.expandvars("$SPLUNK_HOME")
#logger.info("Splunk Home is:" + splunk_home)
splunk_pid = open(os.path.join(splunk_home, "var", "run", "splunk", "conf-mutator.pid"), 'rb').read()
#logger.info("Splunk PID is:" + splunk_pid)
sessionKey = sys.stdin.readline().strip()
#logger.info("variables initialized: splunk_home=" + splunk_home + " splunk_pid=" + splunk_pid)

# start the real work
# Read in all Access Tokens from nope.conf

proc = []
keys_dict = {}
get_path = '/servicesNS/nobody/FitbitAddonforSplunk/storage/passwords?output_mode=json'
try:
    serverResponse = splunk.rest.simpleRequest(get_path, sessionKey=sessionKey, method='GET', raiseAllErrors=True)
except Exception as e:
    logger.info(str(e))
jsonObj = json.loads(serverResponse[1])
my_app = "FitbitAddonforSplunk"
if len(jsonObj['entry']) == 0:
    logger.warn("No credentials found.")
    sleep(60)
    sys.exit(0)
else:
    for entry in jsonObj['entry']:
        if entry['acl']['app'] != my_app:
            continue
        #logger.info('Found a stanza for the Fitbit Add-on')
        if 'clear_password' in entry['content'] and 'username' in entry['content']:
            keys_dict[entry['content']['username']] = entry['content']['clear_password']
            tokens = entry['content']['clear_password']
            token_id = entry['content']['username']
            
tokens_json = jsonObj = json.loads(tokens)
#Print Current Keys
logger.info(tokens_json['APIKey'])
logger.info(tokens_json['RefreshToken'])

logger.info("Going to Bed")
sleep(10)
logger.info("waking up")

try:
    #Refresh Token 
    req = urllib2.Request('https://5876gyevwj.execute-api.us-west-2.amazonaws.com/prod/refreshFitbitToken?code='+tokens_json['RefreshToken'])
    response = urllib2.urlopen(req)
    codes = json.loads(response.read())
    logger.info(str(codes))
except Exception as e:
    logger.info(str(e))


#Print for Diagnosis
refreshed_tokens_json = codes
logger.info(refreshed_tokens_json['APIKey'])
logger.info(refreshed_tokens_json['RefreshToken'])

json_built='{\"APIKey\":\"'+refreshed_tokens_json['APIKey']+'\",\"RefreshToken\":\"'+refreshed_tokens_json['RefreshToken']+'\"}'
logger.info(json_built)



#Post New Token To Splunk
