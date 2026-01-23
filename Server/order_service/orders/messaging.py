import os
import json
import logging
from confluent_kafka import Producer

logger = logging.getLogger(__name__)

# Ensure this matches your kafka-service name in k8s
KAFKA_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka-service:9092')
p = Producer({'bootstrap.servers': KAFKA_SERVERS})

def publish_order_created(order_data):
    """
    Publishes the order details to the Kafka bus.
    """
    try:
        payload = json.dumps(order_data)
        p.produce('order_events', payload)
        
        # Force the message out of the buffer
        p.flush(timeout=10) 
        print(f"📡 Kafka: Order event pushed to 'order_events' topic.")
    except Exception as e:
        logger.error(f"❌ Kafka Publish Failed: {str(e)}")
