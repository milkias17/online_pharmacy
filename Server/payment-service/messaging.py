from confluent_kafka import Producer, Consumer
import json

p = Producer({'bootstrap.servers': 'kafka-service:9092'})

def start_payment_consumer():
    c = Consumer({
        'bootstrap.servers': 'kafka-service:9092',
        'group.id': 'payment-group',
        'auto.offset.reset': 'earliest'
    })
    c.subscribe(['inventory_events'])
    
    while True:
        msg = c.poll(1.0)
        if msg is None: continue
        data = json.loads(msg.value().decode('utf-8'))
        
        if data['event'] == 'STOCK_RESERVED':
            # 1. Process Money...
            # 2. Shouts Success
            p.produce('payment_events', json.dumps({'event': 'PAYMENT_SUCCESS', 'order_id': data['order_id']}))
            p.flush()