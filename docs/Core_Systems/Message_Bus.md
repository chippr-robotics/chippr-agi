## The Message bus

ChipprAGI uses a pubsub system 

The system topics are:

system
update
remove
tick
pause


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
      "timestamp": "1633028743789",
      "sourceSystem": "ObjectiveCreationSystem"
    }
  }
  ```

To use the message Schema in a system, import the following:

```

// Use the message schema to create a new message
const newMessage = { ...CHIPPRAGI.MessageBus.MessageSchema };

// Update the relevant fields for the new message
newMessage.eventType = 'someEvent';
newMessage.payload.entityId = 456;
// ... and so on
```