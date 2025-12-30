import redis
import json
import os

# Connect to the Redis Service inside Kubernetes
# In K8s, the host is the service name: 'redis-service'
r = redis.Redis(host=os.getenv('REDIS_HOST', 'redis-service'), port=6379, db=0)

def publish_event(event_type, data):
    message = {
        "type": event_type,
        "data": data
    }
    # Publish to a channel named 'global_events'
    r.publish('global_events', json.dumps(message))
    print(f"Published event: {event_type}")