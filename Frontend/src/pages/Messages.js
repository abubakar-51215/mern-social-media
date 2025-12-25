import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { getSocket } from '../socket';
import Sidebar from '../components/Sidebar';
import EnhancedChatBubble from '../components/EnhancedChatBubble';
import VoiceRecorder from '../components/VoiceRecorder';
import ForwardModal from '../components/ForwardModal';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupInfoModal from '../components/GroupInfoModal';
import UserProfileModal from '../components/UserProfileModal';
import { toast } from '../components/Toast';
import { getConversations, getConversationMessages, sendMessage, getOrCreateConversation, sendVoiceMessage, sendVideoMessage, sendDocument, forwardMessage, getGroups, getGroupMessages, sendGroupMessage, getFriends } from '../api';
import './Messages.css';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState('direct'); // 'direct' or 'group'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [activeReactionId, setActiveReactionId] = useState(null); // Track which message has reaction picker open
  const [isTyping, setIsTyping] = useState(false); // Typing indicator state
  const [typingUser, setTypingUser] = useState(null); // Who is typing
  const [onlineUsers, setOnlineUsers] = useState({}); // Track online status { online, lastSeen, status }
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'direct', 'groups'
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedChatRef = useRef(null); // Ref to track selectedChat for socket handlers
  const history = useHistory();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Emoji data with searchable names
  const emojiData = {
    'Smileys & people': [
      { emoji: '😀', names: ['grinning', 'smile', 'happy'] },
      { emoji: '😃', names: ['smiley', 'happy', 'joy'] },
      { emoji: '😄', names: ['smile', 'happy', 'joy'] },
      { emoji: '😁', names: ['grin', 'happy', 'teeth'] },
      { emoji: '😆', names: ['laughing', 'satisfied', 'happy'] },
      { emoji: '😅', names: ['sweat', 'smile', 'nervous'] },
      { emoji: '🤣', names: ['rofl', 'laughing', 'floor'] },
      { emoji: '😂', names: ['joy', 'tears', 'laughing', 'lol', 'funny'] },
      { emoji: '🙂', names: ['smile', 'slightly'] },
      { emoji: '🙃', names: ['upside', 'down', 'silly'] },
      { emoji: '😉', names: ['wink', 'flirt'] },
      { emoji: '😊', names: ['blush', 'smile', 'happy'] },
      { emoji: '😇', names: ['angel', 'innocent', 'halo'] },
      { emoji: '🥰', names: ['love', 'hearts', 'adore'] },
      { emoji: '😍', names: ['heart', 'eyes', 'love', 'crush'] },
      { emoji: '🤩', names: ['star', 'struck', 'excited', 'wow'] },
      { emoji: '😘', names: ['kiss', 'love', 'heart'] },
      { emoji: '😗', names: ['kiss', 'whistle'] },
      { emoji: '😚', names: ['kiss', 'closed', 'eyes'] },
      { emoji: '😙', names: ['kiss', 'smile'] },
      { emoji: '😋', names: ['yum', 'delicious', 'tongue'] },
      { emoji: '😛', names: ['tongue', 'out', 'playful'] },
      { emoji: '😜', names: ['wink', 'tongue', 'crazy'] },
      { emoji: '🤪', names: ['crazy', 'zany', 'wild'] },
      { emoji: '😝', names: ['tongue', 'closed', 'eyes'] },
      { emoji: '🤑', names: ['money', 'rich', 'dollar'] },
      { emoji: '🤗', names: ['hug', 'hugging', 'warm'] },
      { emoji: '🤭', names: ['giggle', 'shy', 'cover'] },
      { emoji: '🤫', names: ['shush', 'quiet', 'secret'] },
      { emoji: '🤔', names: ['thinking', 'hmm', 'wonder'] },
      { emoji: '🤐', names: ['zipper', 'mouth', 'secret'] },
      { emoji: '🤨', names: ['raised', 'eyebrow', 'skeptical'] },
      { emoji: '😐', names: ['neutral', 'meh', 'expressionless'] },
      { emoji: '😑', names: ['expressionless', 'blank'] },
      { emoji: '😶', names: ['no', 'mouth', 'silent'] },
      { emoji: '😏', names: ['smirk', 'smug', 'flirt'] },
      { emoji: '😒', names: ['unamused', 'annoyed', 'bored'] },
      { emoji: '🙄', names: ['eye', 'roll', 'whatever'] },
      { emoji: '😬', names: ['grimace', 'awkward', 'nervous'] },
      { emoji: '🤥', names: ['lying', 'pinocchio', 'liar'] },
      { emoji: '😌', names: ['relieved', 'peaceful', 'calm'] },
      { emoji: '😔', names: ['pensive', 'sad', 'thoughtful'] },
      { emoji: '😪', names: ['sleepy', 'tired', 'zzz'] },
      { emoji: '🤤', names: ['drool', 'hungry', 'yum'] },
      { emoji: '😴', names: ['sleeping', 'zzz', 'tired'] },
      { emoji: '😷', names: ['mask', 'sick', 'covid'] },
      { emoji: '🤒', names: ['thermometer', 'sick', 'fever'] },
      { emoji: '🤕', names: ['bandage', 'hurt', 'injured'] },
      { emoji: '🤢', names: ['nauseous', 'sick', 'green'] },
      { emoji: '🤮', names: ['vomit', 'sick', 'throw up'] },
      { emoji: '🤧', names: ['sneeze', 'tissue', 'sick'] },
      { emoji: '🥵', names: ['hot', 'sweating', 'heat'] },
      { emoji: '🥶', names: ['cold', 'freezing', 'frozen'] },
      { emoji: '😵', names: ['dizzy', 'spiral', 'dead'] },
      { emoji: '🤯', names: ['mind', 'blown', 'exploding', 'shocked'] },
      { emoji: '🤠', names: ['cowboy', 'hat', 'yeehaw'] },
      { emoji: '🥳', names: ['party', 'celebrate', 'birthday'] },
      { emoji: '😎', names: ['cool', 'sunglasses', 'awesome'] },
      { emoji: '🤓', names: ['nerd', 'glasses', 'geek'] },
      { emoji: '🧐', names: ['monocle', 'curious', 'inspect'] }
    ],
    'Animals & nature': [
      { emoji: '🐶', names: ['dog', 'puppy', 'pet'] },
      { emoji: '🐱', names: ['cat', 'kitty', 'pet'] },
      { emoji: '🐭', names: ['mouse', 'rat'] },
      { emoji: '🐹', names: ['hamster', 'pet'] },
      { emoji: '🐰', names: ['rabbit', 'bunny'] },
      { emoji: '🦊', names: ['fox', 'clever'] },
      { emoji: '🐻', names: ['bear', 'teddy'] },
      { emoji: '🐼', names: ['panda', 'bear'] },
      { emoji: '🐨', names: ['koala', 'australia'] },
      { emoji: '🐯', names: ['tiger', 'cat'] },
      { emoji: '🦁', names: ['lion', 'king'] },
      { emoji: '🐮', names: ['cow', 'moo'] },
      { emoji: '🐷', names: ['pig', 'oink'] },
      { emoji: '🐸', names: ['frog', 'toad'] },
      { emoji: '🐵', names: ['monkey', 'ape'] },
      { emoji: '🐔', names: ['chicken', 'hen'] },
      { emoji: '🐧', names: ['penguin', 'bird'] },
      { emoji: '🐦', names: ['bird', 'tweet'] },
      { emoji: '🐤', names: ['chick', 'baby', 'bird'] },
      { emoji: '🦆', names: ['duck', 'quack'] },
      { emoji: '🦅', names: ['eagle', 'bird'] },
      { emoji: '🦉', names: ['owl', 'night'] },
      { emoji: '🦇', names: ['bat', 'vampire'] },
      { emoji: '🐺', names: ['wolf', 'howl'] },
      { emoji: '🐗', names: ['boar', 'pig'] },
      { emoji: '🐴', names: ['horse', 'pony'] },
      { emoji: '🦄', names: ['unicorn', 'magic', 'horse'] },
      { emoji: '🐝', names: ['bee', 'honey', 'buzz'] },
      { emoji: '🐛', names: ['bug', 'caterpillar'] },
      { emoji: '🦋', names: ['butterfly', 'beautiful'] },
      { emoji: '🐌', names: ['snail', 'slow'] },
      { emoji: '🐞', names: ['ladybug', 'beetle'] },
      { emoji: '🐜', names: ['ant', 'insect'] },
      { emoji: '🦟', names: ['mosquito', 'bug'] },
      { emoji: '🦗', names: ['cricket', 'grasshopper'] },
      { emoji: '🌸', names: ['cherry', 'blossom', 'flower', 'spring'] },
      { emoji: '🌺', names: ['hibiscus', 'flower', 'tropical'] },
      { emoji: '🌻', names: ['sunflower', 'sun', 'yellow'] },
      { emoji: '🌷', names: ['tulip', 'flower', 'spring'] },
      { emoji: '🌹', names: ['rose', 'flower', 'love', 'red'] },
      { emoji: '🥀', names: ['wilted', 'flower', 'dead'] },
      { emoji: '🌼', names: ['blossom', 'flower', 'yellow'] },
      { emoji: '🌵', names: ['cactus', 'desert'] },
      { emoji: '🌲', names: ['tree', 'evergreen', 'christmas'] },
      { emoji: '🌳', names: ['tree', 'deciduous'] },
      { emoji: '🌴', names: ['palm', 'tree', 'tropical'] },
      { emoji: '🌱', names: ['seedling', 'plant', 'grow'] },
      { emoji: '🌿', names: ['herb', 'leaf', 'plant'] },
      { emoji: '☘️', names: ['shamrock', 'clover', 'irish'] },
      { emoji: '🍀', names: ['four', 'leaf', 'clover', 'lucky'] }
    ],
    'Food & drink': [
      { emoji: '🍎', names: ['apple', 'red', 'fruit'] },
      { emoji: '🍊', names: ['orange', 'tangerine', 'fruit'] },
      { emoji: '🍋', names: ['lemon', 'yellow', 'citrus'] },
      { emoji: '🍌', names: ['banana', 'fruit', 'yellow'] },
      { emoji: '🍉', names: ['watermelon', 'summer', 'fruit'] },
      { emoji: '🍇', names: ['grapes', 'wine', 'fruit'] },
      { emoji: '🍓', names: ['strawberry', 'berry', 'fruit'] },
      { emoji: '🍈', names: ['melon', 'fruit'] },
      { emoji: '🍒', names: ['cherry', 'cherries', 'fruit'] },
      { emoji: '🍑', names: ['peach', 'fruit'] },
      { emoji: '🥭', names: ['mango', 'tropical', 'fruit'] },
      { emoji: '🍍', names: ['pineapple', 'tropical', 'fruit'] },
      { emoji: '🥥', names: ['coconut', 'tropical'] },
      { emoji: '🥝', names: ['kiwi', 'fruit', 'green'] },
      { emoji: '🍅', names: ['tomato', 'vegetable', 'red'] },
      { emoji: '🍆', names: ['eggplant', 'aubergine', 'vegetable'] },
      { emoji: '🥑', names: ['avocado', 'guacamole'] },
      { emoji: '🥦', names: ['broccoli', 'vegetable', 'green'] },
      { emoji: '🥬', names: ['lettuce', 'leafy', 'vegetable'] },
      { emoji: '🥒', names: ['cucumber', 'pickle', 'vegetable'] },
      { emoji: '🌶️', names: ['pepper', 'hot', 'chili', 'spicy'] },
      { emoji: '🌽', names: ['corn', 'maize', 'vegetable'] },
      { emoji: '🥕', names: ['carrot', 'vegetable', 'orange'] },
      { emoji: '🧄', names: ['garlic', 'vampire'] },
      { emoji: '🧅', names: ['onion', 'cry'] },
      { emoji: '🥔', names: ['potato', 'vegetable'] },
      { emoji: '🍠', names: ['sweet', 'potato', 'yam'] },
      { emoji: '🥐', names: ['croissant', 'french', 'bread'] },
      { emoji: '🥯', names: ['bagel', 'bread'] },
      { emoji: '🍞', names: ['bread', 'toast', 'loaf'] },
      { emoji: '🥖', names: ['baguette', 'french', 'bread'] },
      { emoji: '🥨', names: ['pretzel', 'snack'] },
      { emoji: '🧀', names: ['cheese', 'dairy'] },
      { emoji: '🥚', names: ['egg', 'breakfast'] },
      { emoji: '🍳', names: ['fried', 'egg', 'cooking', 'breakfast'] },
      { emoji: '🧈', names: ['butter', 'dairy'] },
      { emoji: '🥞', names: ['pancakes', 'breakfast'] },
      { emoji: '🧇', names: ['waffle', 'breakfast'] },
      { emoji: '🥓', names: ['bacon', 'meat', 'breakfast'] },
      { emoji: '🥩', names: ['steak', 'meat', 'beef'] },
      { emoji: '🍗', names: ['chicken', 'drumstick', 'meat'] },
      { emoji: '🍖', names: ['meat', 'bone', 'rib'] },
      { emoji: '🦴', names: ['bone', 'dog'] },
      { emoji: '🌭', names: ['hotdog', 'sausage', 'bbq'] },
      { emoji: '🍔', names: ['burger', 'hamburger', 'fast food'] },
      { emoji: '🍟', names: ['fries', 'french', 'fast food'] },
      { emoji: '🍕', names: ['pizza', 'italian', 'slice'] },
      { emoji: '🥪', names: ['sandwich', 'lunch'] },
      { emoji: '🥙', names: ['pita', 'falafel', 'wrap'] },
      { emoji: '🧆', names: ['falafel', 'middle eastern'] }
    ],
    'Activity': [
      { emoji: '⚽', names: ['soccer', 'football', 'ball', 'sport'] },
      { emoji: '🏀', names: ['basketball', 'ball', 'sport'] },
      { emoji: '🏈', names: ['football', 'american', 'nfl', 'sport'] },
      { emoji: '⚾', names: ['baseball', 'ball', 'sport'] },
      { emoji: '🥎', names: ['softball', 'ball'] },
      { emoji: '🎾', names: ['tennis', 'ball', 'sport'] },
      { emoji: '🏐', names: ['volleyball', 'ball', 'sport'] },
      { emoji: '🏉', names: ['rugby', 'ball', 'sport'] },
      { emoji: '🥏', names: ['frisbee', 'disc'] },
      { emoji: '🎱', names: ['pool', 'billiards', 'eight ball'] },
      { emoji: '🪀', names: ['yoyo', 'toy'] },
      { emoji: '🏓', names: ['ping pong', 'table tennis'] },
      { emoji: '🏸', names: ['badminton', 'shuttlecock'] },
      { emoji: '🏒', names: ['hockey', 'ice', 'sport'] },
      { emoji: '🏑', names: ['field hockey', 'sport'] },
      { emoji: '🥍', names: ['lacrosse', 'sport'] },
      { emoji: '🏏', names: ['cricket', 'bat'] },
      { emoji: '🥅', names: ['goal', 'net'] },
      { emoji: '⛳', names: ['golf', 'hole', 'flag'] },
      { emoji: '🪁', names: ['kite', 'flying'] },
      { emoji: '🏹', names: ['archery', 'bow', 'arrow'] },
      { emoji: '🎣', names: ['fishing', 'rod', 'fish'] },
      { emoji: '🤿', names: ['diving', 'scuba', 'snorkel'] },
      { emoji: '🥊', names: ['boxing', 'glove', 'fight'] },
      { emoji: '🥋', names: ['martial arts', 'karate', 'judo'] },
      { emoji: '🏽', names: ['skin', 'tone'] },
      { emoji: '🛹', names: ['skateboard', 'skate'] },
      { emoji: '🛷', names: ['sled', 'sledge', 'winter'] },
      { emoji: '⛸️', names: ['ice', 'skating', 'winter'] },
      { emoji: '🥌', names: ['curling', 'stone', 'winter'] },
      { emoji: '🎿', names: ['ski', 'skiing', 'winter', 'snow'] },
      { emoji: '⛷️', names: ['skier', 'skiing', 'winter'] },
      { emoji: '🏂', names: ['snowboard', 'winter', 'snow'] },
      { emoji: '🪂', names: ['parachute', 'skydiving'] },
      { emoji: '🏋️', names: ['weightlifting', 'gym', 'workout'] },
      { emoji: '🤼', names: ['wrestling', 'fight'] },
      { emoji: '🤸', names: ['cartwheel', 'gymnastics'] },
      { emoji: '🤺', names: ['fencing', 'sword'] },
      { emoji: '⛹️', names: ['basketball', 'bouncing', 'ball'] },
      { emoji: '🤾', names: ['handball', 'sport'] },
      { emoji: '🏌️', names: ['golf', 'golfing'] },
      { emoji: '🏇', names: ['horse', 'racing', 'jockey'] },
      { emoji: '🧘', names: ['yoga', 'meditation', 'zen'] },
      { emoji: '🏊', names: ['swimming', 'pool', 'swim'] },
      { emoji: '🤽', names: ['water polo', 'swim'] },
      { emoji: '🚣', names: ['rowing', 'boat'] },
      { emoji: '🧗', names: ['climbing', 'rock'] },
      { emoji: '🚴', names: ['cycling', 'bike', 'bicycle'] },
      { emoji: '🚵', names: ['mountain', 'biking'] },
      { emoji: '🎪', names: ['circus', 'tent'] }
    ],
    'Travel & places': [
      { emoji: '🚗', names: ['car', 'automobile', 'vehicle'] },
      { emoji: '🚕', names: ['taxi', 'cab', 'car'] },
      { emoji: '🚙', names: ['suv', 'car', 'vehicle'] },
      { emoji: '🚌', names: ['bus', 'public transport'] },
      { emoji: '🚎', names: ['trolleybus', 'bus'] },
      { emoji: '🏎️', names: ['racing', 'car', 'fast'] },
      { emoji: '🚓', names: ['police', 'car', 'cop'] },
      { emoji: '🚑', names: ['ambulance', 'hospital', 'emergency'] },
      { emoji: '🚒', names: ['fire', 'truck', 'emergency'] },
      { emoji: '🚐', names: ['minibus', 'van'] },
      { emoji: '🚚', names: ['truck', 'delivery'] },
      { emoji: '🚛', names: ['truck', 'semi', 'lorry'] },
      { emoji: '🚜', names: ['tractor', 'farm'] },
      { emoji: '🦯', names: ['cane', 'blind'] },
      { emoji: '🦽', names: ['wheelchair', 'manual'] },
      { emoji: '🦼', names: ['wheelchair', 'motorized'] },
      { emoji: '🛴', names: ['scooter', 'kick'] },
      { emoji: '🚲', names: ['bike', 'bicycle', 'cycling'] },
      { emoji: '🛵', names: ['scooter', 'moped', 'vespa'] },
      { emoji: '🏍️', names: ['motorcycle', 'bike'] },
      { emoji: '🛺', names: ['rickshaw', 'auto'] },
      { emoji: '🚨', names: ['police', 'siren', 'emergency'] },
      { emoji: '🚔', names: ['police', 'car'] },
      { emoji: '🚍', names: ['bus', 'front'] },
      { emoji: '🚘', names: ['car', 'oncoming'] },
      { emoji: '🚖', names: ['taxi', 'oncoming'] },
      { emoji: '🚡', names: ['cable', 'car', 'aerial'] },
      { emoji: '🚠', names: ['mountain', 'cableway'] },
      { emoji: '🚟', names: ['suspension', 'railway'] },
      { emoji: '🚃', names: ['railway', 'car', 'train'] },
      { emoji: '🚋', names: ['tram', 'car', 'streetcar'] },
      { emoji: '🚞', names: ['mountain', 'railway'] },
      { emoji: '🚝', names: ['monorail', 'train'] },
      { emoji: '🚄', names: ['bullet', 'train', 'fast', 'shinkansen'] },
      { emoji: '🚅', names: ['train', 'high speed'] },
      { emoji: '🚈', names: ['light', 'rail', 'train'] },
      { emoji: '🚂', names: ['locomotive', 'train', 'steam'] },
      { emoji: '🚆', names: ['train', 'railway'] },
      { emoji: '🚇', names: ['metro', 'subway', 'underground'] },
      { emoji: '🚊', names: ['tram', 'streetcar'] },
      { emoji: '🚉', names: ['station', 'train'] },
      { emoji: '✈️', names: ['airplane', 'plane', 'flight', 'travel'] },
      { emoji: '🛫', names: ['takeoff', 'airplane', 'departure'] },
      { emoji: '🛬', names: ['landing', 'airplane', 'arrival'] },
      { emoji: '🛩️', names: ['small', 'plane', 'aircraft'] },
      { emoji: '💺', names: ['seat', 'airplane', 'chair'] },
      { emoji: '🛰️', names: ['satellite', 'space'] },
      { emoji: '🚀', names: ['rocket', 'space', 'launch'] },
      { emoji: '🛸', names: ['ufo', 'alien', 'spaceship'] },
      { emoji: '🚁', names: ['helicopter', 'chopper'] }
    ],
    'Objects': [
      { emoji: '⌚', names: ['watch', 'time', 'clock'] },
      { emoji: '📱', names: ['phone', 'mobile', 'iphone', 'smartphone'] },
      { emoji: '📲', names: ['phone', 'arrow', 'call'] },
      { emoji: '💻', names: ['laptop', 'computer', 'macbook'] },
      { emoji: '⌨️', names: ['keyboard', 'type', 'computer'] },
      { emoji: '🖥️', names: ['desktop', 'computer', 'monitor'] },
      { emoji: '🖨️', names: ['printer', 'print'] },
      { emoji: '🖱️', names: ['mouse', 'computer', 'click'] },
      { emoji: '🖲️', names: ['trackball', 'computer'] },
      { emoji: '🕹️', names: ['joystick', 'game', 'controller'] },
      { emoji: '🗜️', names: ['clamp', 'compress'] },
      { emoji: '💾', names: ['floppy', 'disk', 'save'] },
      { emoji: '💿', names: ['cd', 'disc', 'dvd'] },
      { emoji: '📀', names: ['dvd', 'disc', 'movie'] },
      { emoji: '📼', names: ['vhs', 'tape', 'video'] },
      { emoji: '📷', names: ['camera', 'photo', 'picture'] },
      { emoji: '📸', names: ['camera', 'flash', 'photo'] },
      { emoji: '📹', names: ['video', 'camera', 'record'] },
      { emoji: '🎥', names: ['movie', 'camera', 'film'] },
      { emoji: '📽️', names: ['projector', 'film', 'movie'] },
      { emoji: '🎞️', names: ['film', 'frames', 'movie'] },
      { emoji: '📞', names: ['telephone', 'phone', 'call'] },
      { emoji: '☎️', names: ['telephone', 'phone', 'call'] },
      { emoji: '📟', names: ['pager', 'beeper'] },
      { emoji: '📠', names: ['fax', 'machine'] },
      { emoji: '📺', names: ['tv', 'television', 'screen'] },
      { emoji: '📻', names: ['radio', 'music'] },
      { emoji: '🎙️', names: ['microphone', 'studio', 'podcast'] },
      { emoji: '🎚️', names: ['slider', 'level', 'audio'] },
      { emoji: '🎛️', names: ['knobs', 'control', 'audio'] },
      { emoji: '🧭', names: ['compass', 'direction', 'navigate'] },
      { emoji: '⏱️', names: ['stopwatch', 'timer', 'time'] },
      { emoji: '⏲️', names: ['timer', 'clock', 'time'] },
      { emoji: '⏰', names: ['alarm', 'clock', 'wake'] },
      { emoji: '🕰️', names: ['mantelpiece', 'clock', 'time'] },
      { emoji: '⌛', names: ['hourglass', 'sand', 'time'] },
      { emoji: '⏳', names: ['hourglass', 'flowing', 'time'] },
      { emoji: '📡', names: ['satellite', 'antenna', 'signal'] },
      { emoji: '🔋', names: ['battery', 'power', 'charge'] },
      { emoji: '🔌', names: ['plug', 'electric', 'power'] },
      { emoji: '💡', names: ['lightbulb', 'idea', 'bright'] },
      { emoji: '🔦', names: ['flashlight', 'torch', 'light'] },
      { emoji: '🕯️', names: ['candle', 'light', 'flame'] },
      { emoji: '🪔', names: ['lamp', 'diya', 'oil'] },
      { emoji: '🧯', names: ['fire', 'extinguisher', 'safety'] },
      { emoji: '🛢️', names: ['oil', 'drum', 'barrel'] },
      { emoji: '💸', names: ['money', 'wings', 'flying'] },
      { emoji: '💵', names: ['dollar', 'money', 'cash'] },
      { emoji: '💴', names: ['yen', 'money', 'japan'] },
      { emoji: '💶', names: ['euro', 'money', 'europe'] }
    ],
    'Symbols': [
      { emoji: '❤️', names: ['heart', 'love', 'red'] },
      { emoji: '🧡', names: ['heart', 'orange', 'love'] },
      { emoji: '💛', names: ['heart', 'yellow', 'love'] },
      { emoji: '💚', names: ['heart', 'green', 'love'] },
      { emoji: '💙', names: ['heart', 'blue', 'love'] },
      { emoji: '💜', names: ['heart', 'purple', 'love'] },
      { emoji: '🖤', names: ['heart', 'black', 'love'] },
      { emoji: '🤍', names: ['heart', 'white', 'love'] },
      { emoji: '🤎', names: ['heart', 'brown', 'love'] },
      { emoji: '💔', names: ['broken', 'heart', 'sad'] },
      { emoji: '❣️', names: ['heart', 'exclamation', 'love'] },
      { emoji: '💕', names: ['hearts', 'two', 'love'] },
      { emoji: '💞', names: ['hearts', 'revolving', 'love'] },
      { emoji: '💓', names: ['heartbeat', 'love', 'beating'] },
      { emoji: '💗', names: ['heart', 'growing', 'love'] },
      { emoji: '💖', names: ['heart', 'sparkle', 'love'] },
      { emoji: '💘', names: ['heart', 'arrow', 'cupid'] },
      { emoji: '💝', names: ['heart', 'ribbon', 'gift'] },
      { emoji: '💟', names: ['heart', 'decoration', 'love'] },
      { emoji: '☮️', names: ['peace', 'symbol', 'sign'] },
      { emoji: '✝️', names: ['cross', 'christian', 'religion'] },
      { emoji: '☪️', names: ['islam', 'muslim', 'religion'] },
      { emoji: '🕉️', names: ['om', 'hindu', 'religion'] },
      { emoji: '☸️', names: ['wheel', 'dharma', 'buddhism'] },
      { emoji: '✡️', names: ['star', 'david', 'jewish'] },
      { emoji: '🔯', names: ['star', 'hexagram'] },
      { emoji: '🕎', names: ['menorah', 'jewish', 'hanukkah'] },
      { emoji: '☯️', names: ['yin', 'yang', 'balance'] },
      { emoji: '☦️', names: ['orthodox', 'cross', 'christian'] },
      { emoji: '🛐', names: ['worship', 'pray', 'religion'] },
      { emoji: '⛎', names: ['ophiuchus', 'zodiac'] },
      { emoji: '♈', names: ['aries', 'zodiac', 'horoscope'] },
      { emoji: '♉', names: ['taurus', 'zodiac', 'horoscope'] },
      { emoji: '♊', names: ['gemini', 'zodiac', 'horoscope'] },
      { emoji: '♋', names: ['cancer', 'zodiac', 'horoscope'] },
      { emoji: '♌', names: ['leo', 'zodiac', 'horoscope'] },
      { emoji: '♍', names: ['virgo', 'zodiac', 'horoscope'] },
      { emoji: '♎', names: ['libra', 'zodiac', 'horoscope'] },
      { emoji: '♏', names: ['scorpio', 'zodiac', 'horoscope'] },
      { emoji: '♐', names: ['sagittarius', 'zodiac', 'horoscope'] },
      { emoji: '♑', names: ['capricorn', 'zodiac', 'horoscope'] },
      { emoji: '♒', names: ['aquarius', 'zodiac', 'horoscope'] },
      { emoji: '♓', names: ['pisces', 'zodiac', 'horoscope'] },
      { emoji: '🆔', names: ['id', 'identity', 'badge'] },
      { emoji: '⚛️', names: ['atom', 'science', 'physics'] },
      { emoji: '🉑', names: ['accept', 'chinese'] },
      { emoji: '☢️', names: ['radioactive', 'nuclear', 'danger'] },
      { emoji: '☣️', names: ['biohazard', 'danger', 'toxic'] },
      { emoji: '📴', names: ['phone', 'off', 'mobile'] },
      { emoji: '📳', names: ['vibration', 'phone', 'mode'] }
    ],
    'Flags': [
      { emoji: '🏁', names: ['checkered', 'flag', 'racing', 'finish'] },
      { emoji: '🚩', names: ['flag', 'red', 'triangular'] },
      { emoji: '🎌', names: ['crossed', 'flags', 'japan'] },
      { emoji: '🏴', names: ['black', 'flag', 'waving'] },
      { emoji: '🏳️', names: ['white', 'flag', 'surrender'] },
      { emoji: '🏳️‍🌈', names: ['rainbow', 'flag', 'pride', 'lgbtq'] },
      { emoji: '🏴‍☠️', names: ['pirate', 'flag', 'jolly roger'] },
      { emoji: '🇦🇫', names: ['afghanistan', 'flag'] },
      { emoji: '🇦🇽', names: ['aland', 'islands', 'flag'] },
      { emoji: '🇦🇱', names: ['albania', 'flag'] },
      { emoji: '🇩🇿', names: ['algeria', 'flag'] },
      { emoji: '🇦🇸', names: ['american', 'samoa', 'flag'] },
      { emoji: '🇦🇩', names: ['andorra', 'flag'] },
      { emoji: '🇦🇴', names: ['angola', 'flag'] },
      { emoji: '🇦🇮', names: ['anguilla', 'flag'] },
      { emoji: '🇦🇶', names: ['antarctica', 'flag'] },
      { emoji: '🇦🇬', names: ['antigua', 'barbuda', 'flag'] },
      { emoji: '🇦🇷', names: ['argentina', 'flag'] },
      { emoji: '🇦🇲', names: ['armenia', 'flag'] },
      { emoji: '🇦🇼', names: ['aruba', 'flag'] },
      { emoji: '🇦🇺', names: ['australia', 'flag'] },
      { emoji: '🇦🇹', names: ['austria', 'flag'] },
      { emoji: '🇦🇿', names: ['azerbaijan', 'flag'] },
      { emoji: '🇧🇸', names: ['bahamas', 'flag'] },
      { emoji: '🇧🇭', names: ['bahrain', 'flag'] },
      { emoji: '🇧🇩', names: ['bangladesh', 'flag'] },
      { emoji: '🇧🇧', names: ['barbados', 'flag'] },
      { emoji: '🇧🇾', names: ['belarus', 'flag'] },
      { emoji: '🇧🇪', names: ['belgium', 'flag'] },
      { emoji: '🇧🇿', names: ['belize', 'flag'] },
      { emoji: '🇧🇯', names: ['benin', 'flag'] },
      { emoji: '🇧🇲', names: ['bermuda', 'flag'] },
      { emoji: '🇧🇹', names: ['bhutan', 'flag'] },
      { emoji: '🇧🇴', names: ['bolivia', 'flag'] },
      { emoji: '🇧🇦', names: ['bosnia', 'herzegovina', 'flag'] },
      { emoji: '🇧🇼', names: ['botswana', 'flag'] },
      { emoji: '🇧🇷', names: ['brazil', 'flag'] },
      { emoji: '🇮🇴', names: ['british', 'indian', 'ocean', 'flag'] },
      { emoji: '🇻🇬', names: ['british', 'virgin', 'islands', 'flag'] },
      { emoji: '🇧🇳', names: ['brunei', 'flag'] },
      { emoji: '🇧🇬', names: ['bulgaria', 'flag'] },
      { emoji: '🇧🇫', names: ['burkina', 'faso', 'flag'] },
      { emoji: '🇧🇮', names: ['burundi', 'flag'] },
      { emoji: '🇰🇭', names: ['cambodia', 'flag'] },
      { emoji: '🇨🇲', names: ['cameroon', 'flag'] },
      { emoji: '🇨🇦', names: ['canada', 'flag'] },
      { emoji: '🇮🇨', names: ['canary', 'islands', 'flag'] },
      { emoji: '🇨🇻', names: ['cape', 'verde', 'flag'] },
      { emoji: '🇧🇶', names: ['caribbean', 'netherlands', 'flag'] },
      { emoji: '🇵🇰', names: ['pakistan', 'flag'] },
      { emoji: '🇺🇸', names: ['usa', 'united states', 'america', 'flag'] },
      { emoji: '🇬🇧', names: ['uk', 'united kingdom', 'britain', 'flag'] },
      { emoji: '🇮🇳', names: ['india', 'flag'] },
      { emoji: '🇨🇳', names: ['china', 'flag'] },
      { emoji: '🇯🇵', names: ['japan', 'flag'] },
      { emoji: '🇰🇷', names: ['korea', 'south', 'flag'] },
      { emoji: '🇫🇷', names: ['france', 'flag'] },
      { emoji: '🇩🇪', names: ['germany', 'flag'] },
      { emoji: '🇮🇹', names: ['italy', 'flag'] },
      { emoji: '🇪🇸', names: ['spain', 'flag'] },
      { emoji: '🇷🇺', names: ['russia', 'flag'] },
      { emoji: '🇸🇦', names: ['saudi', 'arabia', 'flag'] },
      { emoji: '🇦🇪', names: ['uae', 'emirates', 'flag'] },
      { emoji: '🇹🇷', names: ['turkey', 'flag'] }
    ]
  };

  const emojiCategories = Object.fromEntries(
    Object.entries(emojiData).map(([category, emojis]) => [category, emojis.map(e => e.emoji)])
  );
  const [selectedCategory, setSelectedCategory] = useState('Smileys & people');
  const [emojiSearch, setEmojiSearch] = useState('');

  // Keep selectedChatRef in sync with selectedChat state
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Socket.io setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUser?._id) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Ensure join is emitted even if socket was created elsewhere.
    socket.emit('join', currentUser._id);

    const handleConnect = () => {
      console.log('Socket connected, joining with userId:', currentUser._id);
      socket.emit('join', currentUser._id);
    };

    const handleConnectError = (error) => {
      // Non-fatal: Socket.IO may fallback transports.
      console.warn('Socket connection error:', error?.message || error);
    };

    const handleReceiveMessage = (data) => {
      console.log('Received message via socket:', data);
      // data contains { conversationId, message }
      const message = data.message || data;
      const conversationId = data.conversationId;
      
      // Only add message if it's for the currently selected chat (use ref to avoid stale closure)
      if (selectedChatRef.current?._id === conversationId) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
      // Always reload conversations to update sidebar
      loadConversations();
    };

    const handleReactionAdded = ({ messageId, reaction }) => {
      if (!reaction) return;
      const { emoji, user } = reaction;
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const userId = user?._id || user;
          const existingReaction = msg.reactions?.find(r => {
            const rUserId = r.user?._id || r.user;
            return rUserId === userId;
          });

          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map(r => {
                const rUserId = r.user?._id || r.user;
                return rUserId === userId ? { ...r, emoji } : r;
              })
            };
          }

          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, user }]
          };
        }
        return msg;
      }));
    };

    const handleReactionRemoved = ({ messageId, userId }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(r => {
              const rUserId = r.user?._id || r.user;
              return rUserId !== userId;
            })
          };
        }
        return msg;
      }));
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          return { ...msg, isDeleted: true, text: 'This message was deleted', image: null, video: null, audio: null, file: null, fileName: null, fileSize: null };
        }
        return msg;
      }));
    };

    const handleMessageEdited = ({ messageId, text, editedAt }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          return { ...msg, text, isEdited: true, editedAt };
        }
        return msg;
      }));
    };

    const handleGroupMessage = ({ groupId, message }) => {
      if (selectedChatRef.current?._id === groupId && chatType === 'group') {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      loadGroups();
    };

    const handleGroupCreated = (group) => {
      setGroups(prev => [group, ...prev]);
    };

    const handleGroupUpdated = (group) => {
      setGroups(prev => prev.map(g => g._id === group._id ? group : g));
      if (selectedChatRef.current?._id === group._id) {
        setSelectedChat(group);
      }
    };

    const handleGroupMembersAdded = ({ groupId, newMembers }) => {
      setGroups(prev => prev.map(g => {
        if (g._id === groupId) {
          return { ...g, members: [...g.members, ...newMembers] };
        }
        return g;
      }));
    };

    const handleGroupMemberRemoved = ({ groupId, memberId }) => {
      setGroups(prev => prev.map(g => {
        if (g._id === groupId) {
          return { ...g, members: g.members.filter(m => (m.user._id || m.user) !== memberId) };
        }
        return g;
      }));
    };

    const handleRemovedFromGroup = ({ groupId }) => {
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (selectedChatRef.current?._id === groupId) {
        setSelectedChat(null);
        setMessages([]);
      }
    };

    const handleGroupDeleted = ({ groupId }) => {
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (selectedChatRef.current?._id === groupId) {
        setSelectedChat(null);
        setMessages([]);
      }
    };

    const handleUserTyping = ({ conversationId, userId, userName }) => {
      if (selectedChatRef.current?._id === conversationId && userId !== currentUser._id) {
        setIsTyping(true);
        setTypingUser({ _id: userId, name: userName });
      }
    };

    const handleUserStoppedTyping = ({ conversationId, userId }) => {
      if (selectedChatRef.current?._id === conversationId && userId !== currentUser._id) {
        setIsTyping(false);
        setTypingUser(null);
      }
    };

    const handleUserOnline = ({ userId, lastSeen }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { isOnline: true, lastSeen, status: 'online' }
      }));
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { isOnline: false, lastSeen, status: 'offline' }
      }));
    };

    const handleActivityStatusChanged = ({ userId, status }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { ...prev[userId], status, lastSeen: new Date() }
      }));
    };

    const handleMessagesSeen = ({ conversationId }) => {
      if (selectedChatRef.current?._id === conversationId) {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true, seenAt: new Date() })));
      }
    };

    const handleConversationUpdated = ({ conversationId, lastMessage, lastMessageTime }) => {
      setConversations(prev => prev.map(conv =>
        conv._id === conversationId
          ? { ...conv, lastMessage, lastMessageTime, unreadCount: (conv.unreadCount || 0) + 1 }
          : conv
      ));
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('reactionAdded', handleReactionAdded);
    socket.on('reactionRemoved', handleReactionRemoved);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('groupMessage', handleGroupMessage);
    socket.on('groupCreated', handleGroupCreated);
    socket.on('groupUpdated', handleGroupUpdated);
    socket.on('groupMembersAdded', handleGroupMembersAdded);
    socket.on('groupMemberRemoved', handleGroupMemberRemoved);
    socket.on('removedFromGroup', handleRemovedFromGroup);
    socket.on('groupDeleted', handleGroupDeleted);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('activityStatusChanged', handleActivityStatusChanged);
    socket.on('messagesSeen', handleMessagesSeen);
    socket.on('conversationUpdated', handleConversationUpdated);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('reactionAdded', handleReactionAdded);
      socket.off('reactionRemoved', handleReactionRemoved);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('groupMessage', handleGroupMessage);
      socket.off('groupCreated', handleGroupCreated);
      socket.off('groupUpdated', handleGroupUpdated);
      socket.off('groupMembersAdded', handleGroupMembersAdded);
      socket.off('groupMemberRemoved', handleGroupMemberRemoved);
      socket.off('removedFromGroup', handleRemovedFromGroup);
      socket.off('groupDeleted', handleGroupDeleted);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('activityStatusChanged', handleActivityStatusChanged);
      socket.off('messagesSeen', handleMessagesSeen);
      socket.off('conversationUpdated', handleConversationUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  // Auto-detect away status based on user inactivity
  useEffect(() => {
    let awayTimeout;
    let isAway = false;
    
    const setUserOnline = () => {
      if (isAway && socketRef.current) {
        socketRef.current.emit('updateActivityStatus', { 
          userId: currentUser._id, 
          status: 'online' 
        });
        isAway = false;
      }
      
      // Reset the timeout
      clearTimeout(awayTimeout);
      awayTimeout = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('updateActivityStatus', { 
            userId: currentUser._id, 
            status: 'away' 
          });
          isAway = true;
        }
      }, 5 * 60 * 1000); // 5 minutes
    };
    
    // Events that indicate user activity
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, setUserOnline));
    
    // Set initial online status
    setUserOnline();
    
    return () => {
      clearTimeout(awayTimeout);
      events.forEach(event => window.removeEventListener(event, setUserOnline));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser._id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getFilteredEmojis = () => {
    if (emojiSearch) {
      const searchLower = emojiSearch.toLowerCase();
      // Search across all categories by emoji names
      return Object.values(emojiData).flat().filter(item => 
        item.names.some(name => name.toLowerCase().includes(searchLower))
      ).map(item => item.emoji);
    }
    return emojiCategories[selectedCategory];
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage(newMessage + emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    loadConversations();
    loadGroups();
    loadFriends();
    
    // Check if coming with a friendId (from Connections page or UserProfileModal)
    if (location.state?.friendId) {
      openConversationWithFriend(location.state.friendId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore last selected chat when conversations/groups are loaded
  useEffect(() => {
    // Don't auto-open any chat - only open when explicitly clicked
    // This useEffect can be removed or simplified
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, groups]);

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await getGroups();
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await getFriends();
      setFriends(response || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    }
  };

  const openConversationWithFriend = async (friendId) => {
    try {
      const response = await getOrCreateConversation(friendId);
      const conversation = response.data;
      
      // Add to conversations if not already there
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });
      
      // Select the conversation
      handleSelectChat(conversation);
    } catch (error) {
      console.error('Error opening conversation:', error);
      alert(error.response?.data?.message || 'Failed to open conversation. Make sure you are friends with this user.');
    }
  };

  const handleSelectChat = async (chat, type = 'direct') => {
    setSelectedChat(chat);
    setChatType(type);
    setIsTyping(false);
    setTypingUser(null);
    
    // Save selected chat to localStorage
    localStorage.setItem('lastSelectedChat', JSON.stringify({ chatId: chat._id, type }));
    
    if (type === 'direct') {
      // Clear unread count for this conversation locally
      setConversations(prev => prev.map(conv => 
        conv._id === chat._id ? { ...conv, unreadCount: 0 } : conv
      ));
      
      try {
        const response = await getConversationMessages(chat._id);
        setMessages(response.data || []);
        
        // Emit messagesSeen to notify sender that messages are read
        if (socketRef.current && chat.participant?._id) {
          socketRef.current.emit('messagesSeen', {
            conversationId: chat._id,
            receiverId: chat.participant._id
          });
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    } else if (type === 'group') {
      try {
        const response = await getGroupMessages(chat._id);
        setMessages(response.data || []);
      } catch (error) {
        console.error('Error loading group messages:', error);
        setMessages([]);
      }
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!selectedChat || !socketRef.current) return;

    // Emit typing event
    socketRef.current.emit('typing', {
      conversationId: selectedChat._id,
      userId: currentUser._id,
      userName: currentUser.name
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && selectedChat) {
        socketRef.current.emit('stopTyping', {
          conversationId: selectedChat._id,
          userId: currentUser._id
        });
      }
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    // Stop typing indicator
    if (socketRef.current && selectedChat) {
      socketRef.current.emit('stopTyping', {
        conversationId: selectedChat._id,
        userId: currentUser._id
      });
    }

    try {
      let response;
      if (chatType === 'group') {
        response = await sendGroupMessage(selectedChat._id, newMessage);
      } else {
        response = await sendMessage(selectedChat._id, newMessage);
      }
      const sentMessage = response.data;
      
      setMessages([...messages, sentMessage]);
      setNewMessage('');
      
      // Update conversation/group list with new last message
      if (chatType === 'group') {
        loadGroups();
      } else {
        loadConversations();
      }
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.message || 'Failed to send message.');
    }
  };

  const handleSendVoice = async (audioBlob) => {
    if (!selectedChat) return;
    
    try {
      const response = await sendVoiceMessage(selectedChat._id, audioBlob);
      const sentMessage = response.data;
      
      setMessages([...messages, sentMessage]);
      setShowVoiceRecorder(false);
      toast.success('✓ Voice message sent', { duration: 2000 });
      loadConversations();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;

    const fileType = file.type.split('/')[0];
    if (fileType !== 'image' && fileType !== 'video') {
      alert('Please select an image or video file');
      return;
    }

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await sendVideoMessage(selectedChat._id, formData);
      const sentMessage = response.data;
      
      setMessages([...messages, sentMessage]);
      loadConversations();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending media:', error);
      alert('Failed to send media');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDocumentSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;

    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 25MB limit');
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed',
      'application/vnd.rar'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP, RAR');
      return;
    }

    setUploadingMedia(true);
    try {
      const response = await sendDocument(selectedChat._id, file);
      const sentMessage = response.data;
      
      setMessages([...messages, sentMessage]);
      loadConversations();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending document:', error);
      alert('Failed to send document');
    } finally {
      setUploadingMedia(false);
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    }
  };

  const handleForwardMessage = async (conversationIds) => {
    if (!forwardingMessage) return;

    try {
      await forwardMessage(forwardingMessage._id, conversationIds);
      toast.success(`✓ Message forwarded to ${conversationIds.length} conversation(s)`, { duration: 3000 });
      setForwardingMessage(null);
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    }
  };

  const handleDeleteMessage = (messageId) => {
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        return { ...msg, isDeleted: true, text: 'This message was deleted', image: null, video: null, audio: null, file: null, fileName: null, fileSize: null };
      }
      return msg;
    }));
  };

  const handleEditMessage = (messageId, newText) => {
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        return { ...msg, text: newText, isEdited: true, editedAt: new Date() };
      }
      return msg;
    }));
  };

  // Handle reaction updates (optimistic UI update)
  const handleReactionUpdate = (messageId, emoji, user, action) => {
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        const userId = user?._id || user?.id;
        
        if (action === 'remove') {
          // Remove the user's reaction
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(r => {
              const rUserId = r.user?._id || r.user;
              return rUserId !== userId;
            })
          };
        } else if (action === 'add') {
          // Check if user already has a reaction
          const existingReaction = (msg.reactions || []).find(r => {
            const rUserId = r.user?._id || r.user;
            return rUserId === userId;
          });
          
          if (existingReaction) {
            // Update existing reaction
            return {
              ...msg,
              reactions: msg.reactions.map(r => {
                const rUserId = r.user?._id || r.user;
                return rUserId === userId ? { ...r, emoji } : r;
              })
            };
          } else {
            // Add new reaction
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { emoji, user }]
            };
          }
        }
      }
      return msg;
    }));
  };

  // Handle group creation
  const handleGroupCreated = (group) => {
    setGroups(prev => [group, ...prev]);
    setShowCreateGroupModal(false);
    handleSelectChat(group, 'group');
  };

  // Handle group updates from GroupInfoModal
  const handleGroupUpdated = (updatedGroup) => {
    setGroups(prev => prev.map(g => g._id === updatedGroup._id ? updatedGroup : g));
    if (selectedChat?._id === updatedGroup._id) {
      setSelectedChat(updatedGroup);
    }
  };

  const handleGroupLeft = (groupId) => {
    setGroups(prev => prev.filter(g => g._id !== groupId));
    if (selectedChat?._id === groupId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  const handleGroupDeleted = (groupId) => {
    setGroups(prev => prev.filter(g => g._id !== groupId));
    if (selectedChat?._id === groupId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combined and sorted list for "All" tab
  const getCombinedChats = () => {
    const directChats = filteredConversations.map(conv => ({
      ...conv,
      type: 'direct',
      sortTime: new Date(conv.lastMessageTime || conv.updatedAt || 0).getTime()
    }));
    
    const groupChats = filteredGroups.map(group => ({
      ...group,
      type: 'group',
      sortTime: new Date(group.lastMessageTime || group.updatedAt || 0).getTime()
    }));
    
    return [...directChats, ...groupChats].sort((a, b) => b.sortTime - a.sortTime);
  };

  const formatTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return past.toLocaleDateString();
  };

  // Format last seen timestamp
  const formatLastSeen = (date) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    
    if (seconds < 60) return 'last seen just now';
    if (seconds < 3600) return `last seen ${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (seconds < 172800) return 'last seen yesterday';
    return `last seen ${past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Get user presence status
  const getUserPresence = (userId) => {
    const userStatus = onlineUsers[userId];
    if (userStatus?.isOnline) {
      return { status: userStatus.status || 'online', isOnline: true };
    }
    // Check from conversation participant data as fallback
    const conv = conversations.find(c => c.participant?._id === userId);
    if (conv?.participant) {
      return {
        status: conv.participant.activityStatus || 'offline',
        isOnline: conv.participant.isOnline || false,
        lastSeen: conv.participant.lastSeen
      };
    }
    return { status: 'offline', isOnline: false };
  };

  // Format date for separators (like WhatsApp)
  const formatDateSeparator = (date) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time for comparison
    const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (msgDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (msgDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      // Check if same week
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (msgDate > weekAgo) {
        return msgDate.toLocaleDateString('en-US', { weekday: 'long' });
      }
      return msgDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  // Group messages by date
  const getMessagesWithDateSeparators = () => {
    const result = [];
    let lastDate = null;
    
    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.createdAt);
      const msgDateStr = msgDate.toDateString();
      
      if (msgDateStr !== lastDate) {
        result.push({ type: 'date-separator', date: msg.createdAt, id: `date-${index}` });
        lastDate = msgDateStr;
      }
      result.push({ type: 'message', data: msg });
    });
    
    return result;
  };

  // Render conversation item
  const renderConversationItem = (item) => {
    if (item.type === 'group') {
      return (
        <div
          key={item._id}
          className={`conversation-item ${selectedChat?._id === item._id && chatType === 'group' ? 'active' : ''}`}
          onClick={() => handleSelectChat(item, 'group')}
        >
          <div className="conv-avatar group-avatar">
            {item.avatar ? (
              <img src={`http://localhost:5000${item.avatar}`} alt={item.name} />
            ) : (
              <span className="group-icon">👥</span>
            )}
          </div>
          <div className="conv-info">
            <div className="conv-header">
              <span className="conv-name">{item.name}</span>
              <span className="conv-time">{formatTime(item.lastMessageTime || item.updatedAt)}</span>
            </div>
            <div className="conv-preview">
              <span className={`last-message ${item.lastMessage?.includes('▁') ? 'voice-message' : ''}`}>{item.lastMessage || `${item.members?.length || 0} members`}</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Direct conversation
    return (
      <div
        key={item._id}
        className={`conversation-item ${selectedChat?._id === item._id && chatType === 'direct' ? 'active' : ''} ${item.unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => handleSelectChat(item, 'direct')}
      >
        <div className="conv-avatar">
          {item.participant?.profilePicture ? (
            <img src={item.participant.profilePicture.startsWith('http') ? item.participant.profilePicture : `http://localhost:5000${item.participant.profilePicture}`} alt={item.participant.name || 'User'} />
          ) : (
            <span className="avatar-initial">{(item.participant?.name || 'U').charAt(0).toUpperCase()}</span>
          )}
          {(() => {
            const presence = getUserPresence(item.participant?._id);
            if (presence.isOnline) {
              return <span className={`online-indicator ${presence.status}`}></span>;
            }
            return null;
          })()}
        </div>
        <div className="conv-info">
          <div className="conv-header">
            <span className={`conv-name ${item.unreadCount > 0 ? 'unread' : ''}`}>
              {item.participant?.name || (typeof item.participant === 'string' ? 'Loading...' : 'Unknown User')}
            </span>
            <span className="conv-time">{formatTime(item.lastMessageTime)}</span>
          </div>
          <div className="conv-preview">
            <span className={`last-message ${item.unreadCount > 0 ? 'unread' : ''} ${item.lastMessage?.includes('🎤') ? 'voice-message' : ''}`}>
              {item.lastMessage || 'No messages yet'}
            </span>
            {item.unreadCount > 0 && (
              <span className="unread-badge">{item.unreadCount > 99 ? '99+' : item.unreadCount}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Sidebar />
      <div className="messages-page">
      <div className="messages-sidebar">
        <div className="messages-header">
          <h2>Messages</h2>
          {!selectedChat && (
            <div className="header-actions">
              <button className="new-group-btn" onClick={() => setShowCreateGroupModal(true)} title="Create Group">👥+</button>
              <button className="new-message-btn" onClick={() => history.push('/connections')}>✏️</button>
            </div>
          )}
        </div>
        <div className="search-messages">
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="chat-tabs">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
            onClick={() => setActiveTab('direct')}
          >
            Direct
          </button>
          <button 
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups ({groups.length})
          </button>
        </div>
        <div className="conversations-list">
          {activeTab === 'all' && (
            getCombinedChats().length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet</p>
                <button onClick={() => history.push('/connections')}>Start a conversation</button>
              </div>
            ) : (
              getCombinedChats().map(item => renderConversationItem(item))
            )
          )}
          {activeTab === 'direct' && (
            filteredConversations.length === 0 ? (
              <div className="empty-state">
                <p>No direct messages</p>
                <button onClick={() => history.push('/connections')}>Start a conversation</button>
              </div>
            ) : (
              filteredConversations.map(conv => renderConversationItem({ ...conv, type: 'direct' }))
            )
          )}
          {activeTab === 'groups' && (
            filteredGroups.length === 0 ? (
              <div className="empty-state">
                <p>No groups yet</p>
                <button onClick={() => setShowCreateGroupModal(true)}>Create a group</button>
              </div>
            ) : (
              filteredGroups.map(group => renderConversationItem({ ...group, type: 'group' }))
            )
          )}
        </div>
      </div>

      <div className="chat-area">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                {chatType === 'group' ? (
                  <>
                    <div className="chat-avatar group-chat-avatar">
                      {selectedChat.avatar ? (
                        <img src={`http://localhost:5000${selectedChat.avatar}`} alt={selectedChat.name} />
                      ) : (
                        <span className="group-icon">👥</span>
                      )}
                    </div>
                    <div className="chat-user-details">
                      <h3>{selectedChat.name}</h3>
                      <span className="chat-status group-members">
                        {selectedChat.members?.length} members
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div 
                      className="chat-avatar clickable"
                      onClick={() => {
                        const participantId = selectedChat.participant?._id;
                        if (participantId && /^[0-9a-fA-F]{24}$/.test(participantId)) {
                          setSelectedProfileUserId(participantId);
                          setShowUserProfileModal(true);
                        }
                      }}
                    >
                      {selectedChat.participant?.profilePicture ? (
                        <img src={selectedChat.participant.profilePicture.startsWith('http') ? selectedChat.participant.profilePicture : `http://localhost:5000${selectedChat.participant.profilePicture}`} alt={selectedChat.participant.name} />
                      ) : (
                        selectedChat.participant?.name?.charAt(0).toUpperCase()
                      )}
                      {(() => {
                        const presence = getUserPresence(selectedChat.participant?._id);
                        return (
                          <span className={`avatar-status-indicator ${presence.status}`}></span>
                        );
                      })()}
                    </div>
                    <div 
                      className="chat-user-details clickable"
                      onClick={() => {
                        const participantId = selectedChat.participant?._id;
                        if (participantId && /^[0-9a-fA-F]{24}$/.test(participantId)) {
                          setSelectedProfileUserId(participantId);
                          setShowUserProfileModal(true);
                        }
                      }}
                    >
                      <h3>{selectedChat.participant?.name}</h3>
                      {(() => {
                        const presence = getUserPresence(selectedChat.participant?._id);
                        if (isTyping && typingUser) {
                          return <span className="chat-status typing">typing...</span>;
                        }
                        if (presence.isOnline) {
                          return <span className={`chat-status ${presence.status}`}>
                            {presence.status === 'away' ? '🌙 Away' : 
                             presence.status === 'busy' ? '🔴 Busy' : 'Online'}
                          </span>;
                        }
                        const lastSeen = onlineUsers[selectedChat.participant?._id]?.lastSeen || 
                                        selectedChat.participant?.lastSeen;
                        return <span className="chat-status offline">{formatLastSeen(lastSeen)}</span>;
                      })()}
                    </div>
                  </>
                )}
              </div>
              <div className="chat-actions">
                <div className="encryption-indicator" title="Messages are encrypted">
                  🔒 <span>Encrypted</span>
                </div>
                <button className="icon-btn" onClick={() => { setComingSoonFeature('Voice Call'); setShowComingSoonModal(true); }} title="Voice Call - Coming Soon">📞</button>
                <button className="icon-btn" onClick={() => { setComingSoonFeature('Video Call'); setShowComingSoonModal(true); }} title="Video Call - Coming Soon">🎥</button>
                {chatType === 'group' && (
                  <button className="icon-btn" onClick={() => setShowGroupInfoModal(true)} title="Group Info">ℹ️</button>
                )}
              </div>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                getMessagesWithDateSeparators().map((item) => {
                  if (item.type === 'date-separator') {
                    return (
                      <div key={item.id} className="date-separator">
                        <span className="date-separator-text">{formatDateSeparator(item.date)}</span>
                      </div>
                    );
                  }
                  const msg = item.data;
                  return (
                    <EnhancedChatBubble
                      key={msg._id}
                      message={msg}
                      isCurrentUser={msg.sender._id === currentUser._id}
                      currentUser={currentUser}
                      onDelete={handleDeleteMessage}
                      onEdit={handleEditMessage}
                      onForward={() => setForwardingMessage(msg)}
                      activeReactionId={activeReactionId}
                      setActiveReactionId={setActiveReactionId}
                      isGroupChat={chatType === 'group'}
                      showSenderName={chatType === 'group' && msg.sender._id !== currentUser._id}
                      onReactionUpdate={handleReactionUpdate}
                      onViewProfile={(userId) => {
                        if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
                          setSelectedProfileUserId(userId);
                          setShowUserProfileModal(true);
                        }
                      }}
                    />
                  );
                })
              )}
              
              {/* Typing Indicator */}
              {isTyping && typingUser && (
                <div className="typing-indicator">
                  <div className="typing-avatar">
                    {chatType === 'group' ? (
                      <span>{typingUser.name?.charAt(0).toUpperCase()}</span>
                    ) : selectedChat?.participant?.profilePicture ? (
                      <img src={`http://localhost:5000${selectedChat.participant.profilePicture}`} alt="" />
                    ) : (
                      <span>{typingUser.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="typing-bubble">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input" onSubmit={handleSendMessage}>
              <div className="message-input-wrapper">
                <div className="emoji-picker-container-msg" ref={emojiPickerRef}>
                  <button type="button" className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                  {showEmojiPicker && (
                    <div className="emoji-picker-msg">
                      <div className="emoji-search">
                        <input 
                          type="text" 
                          placeholder="Search emoji" 
                          value={emojiSearch}
                          onChange={(e) => setEmojiSearch(e.target.value)}
                        />
                      </div>
                      <div className="emoji-categories">
                        {Object.keys(emojiCategories).map(category => (
                          <button
                            key={category}
                            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => { setSelectedCategory(category); setEmojiSearch(''); }}
                            type="button"
                          >
                            {category === 'Smileys & people' && '😀'}
                            {category === 'Animals & nature' && '🐻'}
                            {category === 'Food & drink' && '🍔'}
                            {category === 'Activity' && '⚽'}
                            {category === 'Travel & places' && '🚗'}
                            {category === 'Objects' && '💡'}
                            {category === 'Symbols' && '❤️'}
                            {category === 'Flags' && '🏁'}
                          </button>
                        ))}
                      </div>
                      <div className="emoji-grid">
                        {getFilteredEmojis().map((emoji, index) => (
                          <button
                            key={index}
                            className="emoji-item"
                            onClick={() => handleEmojiClick(emoji)}
                            type="button"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  className="icon-btn" 
                  onClick={() => setShowVoiceRecorder(true)}
                  title="Send voice message"
                >
                  🎤
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTyping}
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,video/*"
                onChange={handleFileSelect}
              />
              <input
                type="file"
                ref={documentInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                onChange={handleDocumentSelect}
              />
              <button 
                type="button" 
                className="media-btn" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                title="Send photo or video"
              >
                {uploadingMedia ? '⏳' : '📷'}
              </button>
              <button 
                type="button" 
                className="media-btn document-btn" 
                onClick={() => documentInputRef.current?.click()}
                disabled={uploadingMedia}
                title="Send document (PDF, DOC, XLS, etc.)"
              >
                📎
              </button>
              <button type="submit" className="send-btn" disabled={!newMessage.trim()}>Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Select a conversation</h3>
            <p>Choose from your existing conversations or start a new one</p>
            <button className="start-conversation-btn" onClick={() => history.push('/connections')}>
              Go to Connections
            </button>
          </div>
        )}
      </div>
    </div>

    {showVoiceRecorder && (
      <VoiceRecorder
        onSend={handleSendVoice}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    )}

    {forwardingMessage && (
      <ForwardModal
        message={forwardingMessage}
        onForward={handleForwardMessage}
        onClose={() => setForwardingMessage(null)}
      />
    )}

    {showCreateGroupModal && (
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={handleGroupCreated}
        friends={friends}
      />
    )}

    {showGroupInfoModal && selectedChat && chatType === 'group' && (
      <GroupInfoModal
        isOpen={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        group={selectedChat}
        friends={friends}
        currentUser={currentUser}
        onGroupUpdated={handleGroupUpdated}
        onGroupLeft={handleGroupLeft}
        onGroupDeleted={handleGroupDeleted}
      />
    )}

    {showUserProfileModal && selectedProfileUserId && (
      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false);
          setSelectedProfileUserId(null);
        }}
        userId={selectedProfileUserId}
        currentUser={currentUser}
      />
    )}

    {showComingSoonModal && (
      <div className="modal-overlay" onClick={() => setShowComingSoonModal(false)}>
        <div className="coming-soon-modal" onClick={(e) => e.stopPropagation()}>
          <div className="coming-soon-content">
            <div className="coming-soon-icon">
              {comingSoonFeature === 'Voice Call' ? '📞' : '🎥'}
            </div>
            <h2>{comingSoonFeature}</h2>
            <p>This feature is coming soon! We're working hard to bring you the best {comingSoonFeature.toLowerCase()} experience.</p>
            <button className="coming-soon-btn" onClick={() => setShowComingSoonModal(false)}>
              Got it
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Messages;
