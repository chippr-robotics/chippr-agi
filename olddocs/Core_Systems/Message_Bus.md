## The Message bus

ChipprAGI uses a pubsub system 

The system topics are:

| SYSTEM | topics from systems
| UPDATE | Used to update components and systems with update functions
| REMOVE | used to remove systems and components 
| TICK |    system generated tick events
| PAUSE | system generated pause events


Schema for message objects

```
{
    "version": "1.0.0",
    "eventType": "taskExecution",
    "payload": {
      "entityId": "123",
      "componentName": "TaskDescription",
      "data": {}
    },
    "metadata": {
      "timestamp": "1633028743789"
    }
  }
  ```

To use the message Schema in a system, import the following:

```

// Use the message schema to create a new message
let newMessage = { ...CHIPPRAGI.MessageBus.MessageSchema };

// Update the relevant fields for the new message
newMessage.eventType = 'newEntity';
newMessage.payload.entityID = _entityID;
newMessage.payload.component = 'SomeComponent';    
// ... and so on
CHIPPRAGI.publish('SYSTEM', [newMessage]);
```