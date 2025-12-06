# 🎬 Message Features - Visual Flow Diagrams

## 1️⃣ Voice Message Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     VOICE MESSAGE FLOW                           │
└─────────────────────────────────────────────────────────────────┘

    USER ACTION          FRONTEND              BACKEND           DATABASE
        │                    │                     │                 │
        │  Click 🎤          │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Open VoiceRecorder  │                 │
        │                    │ Request mic access  │                 │
        │                    │                     │                 │
        │  Allow mic         │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Start recording     │                 │
        │                    │ Show waveform ~~~   │                 │
        │                    │ Timer: 0:00...      │                 │
        │                    │                     │                 │
        │  Click Stop        │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Stop recording      │                 │
        │                    │ Show audio preview  │                 │
        │                    │                     │                 │
        │  Click Send        │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ sendVoiceMessage()  │                 │
        │                    ├────────────────────►│                 │
        │                    │ POST /send-voice    │ Save audio file │
        │                    │ FormData(audioBlob) ├────────────────►│
        │                    │                     │ Create message  │
        │                    │                     ├────────────────►│
        │                    │                     │ Emit newMessage │
        │                    │ ◄────────────────── │ via Socket.io   │
        │                    │ message object      │                 │
        │  See message       │                     │                 │
        │ ◄──────────────────┤                     │                 │
        │  with 🎤 audio     │ Render in chat      │                 │
        │  playback          │                     │                 │
        │                    │                     │                 │
        │  Other user        │                     │                 │
        │  receives live     │ ◄────────────────── │                 │
        │  via Socket.io     │ 'newMessage' event  │                 │
```

## 2️⃣ Image/Video Sharing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   IMAGE/VIDEO SHARING FLOW                       │
└─────────────────────────────────────────────────────────────────┘

    USER ACTION          FRONTEND              BACKEND           DATABASE
        │                    │                     │                 │
        │  Click 📷          │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Open file picker    │                 │
        │                    │                     │                 │
        │  Select file       │                     │                 │
        │  (image or video)  │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Validate file type  │                 │
        │                    │ Show ⏳ loading     │                 │
        │                    │ sendVideoMessage()  │                 │
        │                    ├────────────────────►│                 │
        │                    │ POST /send-video    │ Save media file │
        │                    │ FormData(file)      ├────────────────►│
        │                    │                     │ uploads/messages│
        │                    │                     │ Create message  │
        │                    │                     ├────────────────►│
        │                    │                     │ messageType:    │
        │                    │                     │ image or video  │
        │                    │ ◄────────────────── │                 │
        │                    │ message object      │                 │
        │  See media         │                     │                 │
        │ ◄──────────────────┤ Render image/video  │                 │
        │  in chat           │ with proper size    │                 │
        │                    │                     │                 │
        │  Click to view     │                     │                 │
        │  full size         │ Show full screen    │                 │
        ├──────────────────► │ (for images)        │                 │
        │                    │ Play/pause controls │                 │
        │                    │ (for videos)        │                 │
```

## 3️⃣ Message Reaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     REACTION FLOW                                │
└─────────────────────────────────────────────────────────────────┘

    USER A               FRONTEND A            BACKEND           FRONTEND B
        │                    │                     │                 │
        │  Hover message     │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Show options menu   │                 │
        │  Click React       │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Show emoji picker   │                 │
        │                    │ ❤️ 😂 😮 😢 👍 🔥  │                 │
        │  Pick ❤️           │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ addReaction()       │                 │
        │                    ├────────────────────►│                 │
        │                    │ POST /reaction      │ Update message  │
        │                    │ body: {emoji: "❤️"} │ reactions array │
        │                    │                     │                 │
        │                    │                     │ Emit            │
        │                    │                     │ reactionAdded   │
        │                    │                     ├────────────────►│
        │  See ❤️            │ ◄────────────────── │                 │
        │  below message     │ Update local state  │                 │
        │ ◄──────────────────┤                     │                 │
        │                    │                     │                 │
        │                    │                     │ User B receives │
        │                    │                     │ ◄───────────────┤
        │                    │                     │ Shows ❤️ live   │
        │                    │                     │                 │
        │  Click ❤️ again    │                     │                 │
        │  to remove         │                     │                 │
        ├──────────────────► │ removeReaction()    │                 │
        │                    ├────────────────────►│                 │
        │                    │ DELETE /reaction    │ Remove from     │
        │                    │                     │ reactions array │
        │                    │                     ├────────────────►│
        │  ❤️ disappears     │ ◄────────────────── │ Emit            │
        │ ◄──────────────────┤                     │ reactionRemoved │
```

## 4️⃣ Message Deletion Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     DELETE MESSAGE FLOW                          │
└─────────────────────────────────────────────────────────────────┘

    USER A               FRONTEND A            BACKEND           FRONTEND B
        │                    │                     │                 │
        │  Hover own msg     │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Show options menu   │                 │
        │  Click Delete      │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ deleteMessage()     │                 │
        │                    ├────────────────────►│                 │
        │                    │ DELETE /messages/id │ Set isDeleted   │
        │                    │                     │ Clear content   │
        │                    │                     │ (text, image,   │
        │                    │                     │  video, audio)  │
        │                    │                     │                 │
        │                    │                     │ Emit            │
        │                    │                     │ messageDeleted  │
        │                    │                     ├────────────────►│
        │  See deleted       │ ◄────────────────── │                 │
        │  notice            │ Update message:     │                 │
        │ ◄──────────────────┤ 🚫 This message     │ User B receives │
        │                    │    was deleted      │ ◄───────────────┤
        │                    │                     │ Shows deleted   │
        │                    │                     │ notice live     │
```

## 5️⃣ Seen Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SEEN STATUS FLOW                             │
└─────────────────────────────────────────────────────────────────┘

    USER A               FRONTEND A            BACKEND           FRONTEND B
        │                    │                     │                 │
        │  Send message      │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ sendMessage()       │                 │
        │                    ├────────────────────►│                 │
        │  See ✓ (sent)      │ POST /send          │ Create message  │
        │ ◄──────────────────┤                     │ seenAt: null    │
        │  single check      │ Render with ✓       │                 │
        │                    │                     ├────────────────►│
        │                    │                     │ Emit newMessage │
        │                    │                     │                 │
        │                    │                     │ User B receives │
        │                    │                     │ ◄───────────────┤
        │                    │                     │ Message arrives │
        │                    │                     │                 │
        │                    │                     │ User B opens    │
        │                    │                     │ conversation    │
        │                    │                     │ ◄───────────────┤
        │                    │                     │                 │
        │                    │                     │ markAsSeen()    │
        │                    │                     │ ◄───────────────┤
        │                    │                     │ Update seenAt   │
        │                    │                     │                 │
        │                    │                     │ Emit            │
        │                    │                     │ messagesSeen    │
        │  See ✓✓ (seen)     │ ◄────────────────── │                 │
        │ ◄──────────────────┤                     │                 │
        │  double check      │ Update to ✓✓        │                 │
```

## 6️⃣ Message Forwarding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     FORWARD MESSAGE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

    USER ACTION          FRONTEND              BACKEND           DATABASE
        │                    │                     │                 │
        │  Hover message     │                     │                 │
        ├──────────────────► │                     │                 │
        │  Click Forward     │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Open ForwardModal   │                 │
        │                    │                     │                 │
        │                    │ Load conversations  │                 │
        │                    ├────────────────────►│                 │
        │                    │ GET /conversations  │ Fetch all       │
        │                    │ ◄────────────────── │ conversations   │
        │                    │                     │                 │
        │  Search "John"     │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Filter local list   │                 │
        │                    │ Show: John Doe      │                 │
        │  Select John ✓     │       Jane Smith    │                 │
        │  Select Jane ✓     │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ Update selection    │                 │
        │  Click "Forward    │ [johnId, janeId]    │                 │
        │   to 2 chats"      │                     │                 │
        ├──────────────────► │                     │                 │
        │                    │ forwardMessage()    │                 │
        │                    ├────────────────────►│                 │
        │                    │ POST /forward       │ Create 2 new    │
        │                    │ body: {             │ messages:       │
        │                    │   conversationIds   ├────────────────►│
        │                    │ }                   │ - John's conv   │
        │                    │                     │ - Jane's conv   │
        │                    │                     │                 │
        │                    │                     │ Copy content:   │
        │                    │                     │ text/image/     │
        │                    │                     │ video/audio     │
        │                    │                     │                 │
        │  See success       │ ◄────────────────── │                 │
        │  "Forwarded to     │                     │                 │
        │   2 chats"         │ Close modal         │                 │
        │ ◄──────────────────┤                     │                 │
        │                    │                     │                 │
        │  John & Jane       │                     │ Emit newMessage │
        │  receive message   │                     │ to both users   │
        │  in their chats    │                     │ via Socket.io   │
```

## 🔄 Socket.io Real-Time Update Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                SOCKET.IO CONNECTION & EVENTS                     │
└─────────────────────────────────────────────────────────────────┘

    USER A OPENS CHAT          BACKEND               USER B OPENS CHAT
            │                      │                         │
            │ Connect Socket.io    │                         │
            ├─────────────────────►│                         │
            │ auth: { token }      │                         │
            │                      │ Verify JWT              │
            │                      │ Add to userSocketMap    │
            │                      │                         │
            │                      │ ◄───────────────────────┤
            │                      │ Connect Socket.io       │
            │                      │ auth: { token }         │
            │                      │                         │
            │                      │ userSocketMap:          │
            │                      │ {                       │
            │                      │   userA: socketId1      │
            │                      │   userB: socketId2      │
            │                      │ }                       │
            │                      │                         │
            │ User A sends msg     │                         │
            ├─────────────────────►│                         │
            │                      │ Save to DB              │
            │                      │ Emit 'newMessage'       │
            │                      ├────────────────────────►│
            │                      │ to User B's socketId    │
            │                      │                         │
            │                      │ User B sees message     │
            │                      │ instantly! ✨           │
            │                      │                         │
            │ User B reacts ❤️     │                         │
            │                      │ ◄───────────────────────┤
            │                      │ Save to DB              │
            │                      │ Emit 'reactionAdded'    │
            │ ◄──────────────────┤                         │
            │ to User A's socketId │                         │
            │                      │                         │
            │ User A sees ❤️       │                         │
            │ instantly! ✨         │                         │
```

## 📱 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                   COMPLETE CHAT EXPERIENCE                       │
└─────────────────────────────────────────────────────────────────┘

1. User A opens Messages page
   └─► Sees conversations list
   └─► Searches for User B
   └─► Clicks on User B's conversation

2. Messages load
   └─► Shows all previous messages
   └─► Text messages with timestamps
   └─► Voice messages with playback
   └─► Images/videos displayed
   └─► Reactions shown below messages
   └─► Read receipts (✓ or ✓✓)

3. User A composes message
   
   Option 1: Text Message
   └─► Type in input field
   └─► Add emojis from picker 😊
   └─► Click Send
   └─► Message appears with ✓
   
   Option 2: Voice Message
   └─► Click 🎤 microphone button
   └─► Allow mic access
   └─► Recording starts (waveform ~~~)
   └─► Click Stop
   └─► Preview audio
   └─► Click Send
   └─► Voice message appears with waveform
   
   Option 3: Photo/Video
   └─► Click 📷 camera button
   └─► Select file
   └─► Upload (⏳ loading)
   └─► Media displays in chat

4. User B receives (real-time via Socket.io)
   └─► Message appears instantly
   └─► Can react with emoji
   └─► User A sees ✓✓ (read receipt)

5. Interactive Features
   
   React to message:
   └─► Hover message → Click React
   └─► Pick emoji: ❤️ 😂 😮 😢 👍 🔥
   └─► Shows below message
   
   Delete message:
   └─► Hover own message → Click Delete
   └─► Replaced with "🚫 This message was deleted"
   
   Forward message:
   └─► Hover message → Click Forward
   └─► Select conversations (multi-select)
   └─► Click "Forward to X chats"
   └─► Message sent to selected users

6. Everything updates in real-time!
   └─► No page refresh needed
   └─► Instant reactions
   └─► Live read receipts
   └─► Immediate deletions
   └─► Real-time forwarding
```

## 🎨 Component State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   MESSAGES.JS STATE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Initial Load:
  conversations: []
  selectedChat: null
  messages: []
  showVoiceRecorder: false
  forwardingMessage: null
          │
          ▼
Load Conversations:
  conversations: [{conv1}, {conv2}, ...]
  selectedChat: null
  messages: []
          │
          ▼
Select Chat:
  conversations: [{conv1}, {conv2}, ...]
  selectedChat: {conv1}
  messages: [{msg1}, {msg2}, ...]
          │
          ├──────────────────────────────────────┐
          │                                      │
          ▼                                      ▼
  Send Text Message:              Record Voice Message:
    messages: [..., newMsg]         showVoiceRecorder: true
    newMessage: ""                        │
    scrollToBottom()                      ▼
                                     Recording... (timer, waveform)
          │                               │
          │                               ▼
          │                          Click Send:
          │                            showVoiceRecorder: false
          │                            messages: [..., voiceMsg]
          │                            scrollToBottom()
          │                               │
          ├───────────────────────────────┘
          │
          ▼
  Forward Message:
    forwardingMessage: {message}
    <ForwardModal shown>
          │
          ▼
    Select conversations
    Click Forward
          │
          ▼
    forwardingMessage: null
    <ForwardModal closed>
```

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY VALIDATION                          │
└─────────────────────────────────────────────────────────────────┘

Every API Request:
    │
    ▼
┌───────────────────┐
│ JWT Token Check   │ ──► No token? → 401 Unauthorized
└───────────────────┘
    │ Valid token
    ▼
┌───────────────────┐
│ Extract User ID   │ ──► req.user = userId
└───────────────────┘
    │
    ▼
┌───────────────────┐
│ Friend Check      │ ──► Not friends? → 403 Forbidden
└───────────────────┘     (for messages/conversations)
    │ Are friends
    ▼
┌───────────────────┐
│ Privacy Check     │ ──► Private & not friend? → 403
└───────────────────┘     (for viewing profile/posts)
    │ Passed
    ▼
┌───────────────────┐
│ Authorization     │ ──► Not owner? → 403 Forbidden
└───────────────────┘     (for delete/edit operations)
    │ Authorized
    ▼
┌───────────────────┐
│ Process Request   │ ──► Success → 200 OK
└───────────────────┘
```

---

**Legend:**
- `│` = Sequential flow
- `├──►` = Action/Request
- `◄───┤` = Response/Result
- `✨` = Real-time update
- `✓` = Sent
- `✓✓` = Seen/Read

**Total Flows Documented:** 8
**Status:** ✅ Complete visual documentation
