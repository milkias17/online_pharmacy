from confluent_kafka import Producer, Consumer
import json

# Producer Setup
p = Producer({'bootstrap.servers': 'kafka-service:9092'})

def publish_order_created(order_id, user_id):
    data = {'event': 'ORDER_CREATED', 'order_id': order_id, 'user_id': user_id}
    p.produce('order_events', json.dumps(data))
    p.flush()

# Consumer Logic (To listen for Payment Success)
def start_order_consumer():
    c = Consumer({
        'bootstrap.servers': 'kafka-service:9092',
        'group.id': 'order-group',
        'auto.offset.reset': 'earliest'
    })
    c.subscribe(['payment_events'])
    while True:
        msg = c.poll(1.0)
        if msg is None: continue
        data = json.loads(msg.value().decode('utf-8'))
        if data['event'] == 'PAYMENT_SUCCESS':
            print(f"Updating Order {data['order_id']} to COMPLETED")