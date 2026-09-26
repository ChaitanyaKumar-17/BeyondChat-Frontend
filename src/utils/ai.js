// ========================================================================
// ON-DEVICE AI ENGINE ? All processing happens client-side
// Preserves E2E encryption: no message data leaves the device
// ========================================================================

// Magic Reply: context-aware suggestion generator
export const generateMagicReplies = (messages, currentUserId) => {
  if (!messages || messages.length === 0) return [];
  // Find last received message
  const lastReceived = [...messages].reverse().find(m => m.senderId !== currentUserId && m.text);
  if (!lastReceived) return [];
  const text = lastReceived.text.toLowerCase();
  const replies = [];

  // Question detection
  if (text.includes('?') || text.startsWith('how') || text.startsWith('what') || text.startsWith('when') || text.startsWith('where') || text.startsWith('why') || text.startsWith('do you') || text.startsWith('can you') || text.startsWith('would you') || text.startsWith('are you')) {
    if (text.includes('how are') || text.includes('how\'s it') || text.includes('what\'s up') || text.includes('how have')) {
      replies.push('I\'m great, thanks! 😊', 'All good here! How about you?', 'Pretty well, keeping busy!', 'Can\'t complain! 😄');
    } else if (text.includes('do you want') || text.includes('would you like') || text.includes('wanna')) {
      replies.push('Sure, I\'d love to! ?', 'Sounds great!', 'Maybe later?', 'Let me think about it');
    } else if (text.includes('can you') || text.includes('could you')) {
      replies.push('Of course!', 'Sure thing! ?', 'I\'ll get right on it', 'Give me a moment');
    } else if (text.includes('when') || text.includes('what time')) {
      replies.push('How about tomorrow?', 'Let me check my schedule', 'Anytime works for me!', 'I\'ll let you know soon');
    } else {
      replies.push('Good question!', 'Let me think...', 'I\'ll look into it', 'Not sure, let me check');
    }
  }
  // Greetings
  else if (/^(hi|hey|hello|sup|yo|good morning|good evening|good afternoon)/i.test(text)) {
    replies.push('Hey! 👋', 'Hi there! How\'s it going?', 'Hello! 👋', 'Hey, what\'s up?');
  }
  // Agreement / positive
  else if (/\b(agree|yes|sure|absolutely|definitely|exactly|right|true|correct)\b/i.test(text)) {
    replies.push('Glad we\'re on the same page! 😊', '100% 💯', 'Exactly my thoughts!', 'Couldn\'t agree more');
  }
  // Emotional / excitement
  else if (/\b(amazing|awesome|incredible|fantastic|love|great|wonderful|excited|beautiful)\b/i.test(text) || /!{2,}/.test(text) || /[\u{1F600}-\u{1F64F}\u{1F389}\u{1F38A}\u{1F525}\u{2728}]/u.test(text)) {
    replies.push('So excited! 🎉', 'That\'s amazing! 🤩', 'I love it! ♥', 'Right?! So good! 👌');
  }
  // Invitation / plans
  else if (/\b(meet|hang|plan|join|come|go out|dinner|lunch|party|movie|event|trip)\b/i.test(text)) {
    replies.push('Count me in! 🙋', 'Sounds fun!', 'When were you thinking?', 'I\'ll be there! 🎉');
  }
  // Compliment
  else if (/\b(nice|looks? good|well done|congrats|proud|impressed|talented)\b/i.test(text)) {
    replies.push('Thanks so much! ?', 'That means a lot! 💙', 'You\'re too kind! 😊', 'Appreciate it!');
  }
  // Apology
  else if (/\b(sorry|apologize|my bad|forgive|mistake)\b/i.test(text)) {
    replies.push('No worries at all! 😊', 'It\'s totally fine!', 'Don\'t worry about it!', 'All good! ?');
  }
  // Help / request
  else if (/\b(help|need|urgent|asap|please|favor)\b/i.test(text)) {
    replies.push('I\'m on it! 💪', 'Happy to help!', 'What do you need?', 'Let me see what I can do');
  }
  // Farewell
  else if (/\b(bye|goodbye|see you|good night|take care|later|ttyl|gotta go)\b/i.test(text)) {
    replies.push('See you! 👋', 'Take care! 💙', 'Talk soon!', 'Bye! Have a great one!');
  }
  // Work / project related
  else if (/\b(deadline|meeting|project|task|update|review|code|design|deploy|bug|feature|sprint)\b/i.test(text)) {
    replies.push('I\'ll review it now 👀', 'Great progress! 🚀', 'Let\'s sync on this', 'I\'ll update you shortly');
  }
  // Generic fallback with smart analysis
  else {
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 3) {
      replies.push('Tell me more! 👀', 'Interesting!', '?', 'Got it!');
    } else if (wordCount <= 10) {
      replies.push('That makes sense!', 'Totally agree ?', 'Nice! ✨', 'For sure!');
    } else {
      replies.push('Well said! ?', 'Thanks for sharing!', 'Interesting perspective!', 'I see what you mean');
    }
  }
  return replies.slice(0, 4);
};

// AI Writing Assistant ? text transformation tools
export const AI_WRITING_TOOLS = [
  { id: 'improve', label: 'Improve', icon: 'sparkles', description: 'Enhance clarity & style' },
  { id: 'shorten', label: 'Shorten', icon: 'scissors', description: 'Make it concise' },
  { id: 'expand', label: 'Expand', icon: 'expand', description: 'Add more detail' },
  { id: 'formal', label: 'Formal', icon: 'briefcase', description: 'Professional tone' },
  { id: 'casual', label: 'Casual', icon: 'smile', description: 'Friendly & relaxed' },
  { id: 'fix', label: 'Fix Grammar', icon: 'check', description: 'Correct errors' },
];

// On-device text transformer (no server calls)
export const applyAiWritingTool = (text, toolId) => {
  if (!text.trim()) return text;
  const sentences = text.replace(/([.!?])\s+/g, '$1|').split('|').filter(s => s.trim());

  switch (toolId) {
    case 'improve': {
      const improvements = {
        'good': 'excellent', 'bad': 'poor', 'big': 'significant', 'small': 'minor',
        'nice': 'wonderful', 'like': 'appreciate', 'thing': 'aspect', 'stuff': 'elements',
        'get': 'obtain', 'make': 'create', 'very': 'remarkably', 'really': 'truly',
        'a lot': 'substantially', 'kind of': 'somewhat', 'sort of': 'rather',
        'pretty good': 'impressive', 'looks good': 'looks excellent', 'i think': 'I believe',
        'want to': 'would like to', 'need to': 'should', 'have to': 'must',
      };
      let result = text;
      Object.entries(improvements).forEach(([key, val]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        result = result.replace(regex, val);
      });
      // Capitalize first letter after period
      result = result.replace(/(^|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
      return result;
    }
    case 'shorten': {
      const fillers = /\b(actually|basically|literally|honestly|you know|I mean|kind of|sort of|just|really|very|quite|pretty much|in my opinion|I think that|I believe that|the fact that|it is important to note that|as a matter of fact|at the end of the day|needless to say)\b/gi;
      let result = text.replace(fillers, '').replace(/\s{2,}/g, ' ').trim();
      if (sentences.length > 2) {
        result = sentences.slice(0, Math.ceil(sentences.length * 0.6)).join(' ');
      }
      return result;
    }
    case 'expand': {
      let result = text;
      if (!result.endsWith('.') && !result.endsWith('!') && !result.endsWith('?')) result += '.';
      const lastSentence = sentences[sentences.length - 1]?.trim() || '';
      if (lastSentence.includes('?')) {
        result += ' I\'d love to hear your thoughts on this.';
      } else if (/\b(great|good|nice|awesome|amazing)\b/i.test(lastSentence)) {
        result += ' I\'m genuinely enthusiastic about where this is heading.';
      } else if (/\b(help|support|assist)\b/i.test(lastSentence)) {
        result += ' Please don\'t hesitate to reach out if you need anything else.';
      } else {
        result += ' Let me know your thoughts on this whenever you get a chance.';
      }
      return result;
    }
    case 'formal': {
      const formalMap = {
        'hi': 'Dear', 'hey': 'Hello', 'thanks': 'Thank you', 'thx': 'Thank you',
        'gonna': 'going to', 'wanna': 'want to', 'gotta': 'have to', 'kinda': 'somewhat',
        'yeah': 'Yes', 'yep': 'Yes', 'nope': 'No', 'ok': 'Understood', 'okay': 'Understood',
        'cool': 'Excellent', 'awesome': 'Outstanding', 'lol': '', 'haha': '',
        'btw': 'Additionally', 'fyi': 'For your information', 'asap': 'at your earliest convenience',
        'i\'m': 'I am', 'don\'t': 'do not', 'can\'t': 'cannot', 'won\'t': 'will not',
        'isn\'t': 'is not', 'aren\'t': 'are not', 'wasn\'t': 'was not',
      };
      let result = text;
      Object.entries(formalMap).forEach(([key, val]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        result = result.replace(regex, val);
      });
      result = result.replace(/(^|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
      result = result.replace(/!+/g, '.').replace(/\s{2,}/g, ' ').trim();
      if (result && !result.endsWith('.') && !result.endsWith('?')) result += '.';
      return result;
    }
    case 'casual': {
      const casualMap = {
        'Hello': 'Hey', 'Dear': 'Hi', 'Thank you': 'Thanks', 'Understood': 'Got it',
        'Excellent': 'Awesome', 'Outstanding': 'Amazing', 'Additionally': 'Oh btw',
        'However': 'But', 'Therefore': 'So', 'Furthermore': 'Plus',
        'I am': 'I\'m', 'do not': 'don\'t', 'cannot': 'can\'t', 'will not': 'won\'t',
        'is not': 'isn\'t', 'are not': 'aren\'t', 'I would': 'I\'d',
        'at your earliest convenience': 'asap', 'For your information': 'FYI',
        'Please': 'Pls', 'perhaps': 'maybe',
      };
      let result = text;
      Object.entries(casualMap).forEach(([key, val]) => {
        result = result.split(key).join(val);
      });
      if (result.endsWith('.') && !result.includes('?')) {
        result = result.slice(0, -1) + '!';
      }
      return result;
    }
    case 'fix': {
      let result = text;
      // Capitalize first letter
      result = result.charAt(0).toUpperCase() + result.slice(1);
      // Fix capitalization after periods
      result = result.replace(/([.!?])\s+([a-z])/g, (m, p, c) => p + ' ' + c.toUpperCase());
      // Capitalize I
      result = result.replace(/\bi\b/g, 'I');
      // Fix common misspellings
      const fixes = {
        'teh': 'the', 'recieve': 'receive', 'wierd': 'weird', 'occured': 'occurred',
        'definately': 'definitely', 'seperate': 'separate', 'occassion': 'occasion',
        'accomodate': 'accommodate', 'untill': 'until', 'tommorow': 'tomorrow',
        'neccessary': 'necessary', 'acheive': 'achieve', 'beleive': 'believe',
        'calender': 'calendar', 'collegue': 'colleague', 'comming': 'coming',
        'doesnot': 'does not', 'doesnt': 'doesn\'t', 'dont': 'don\'t',
        'cant': 'can\'t', 'wont': 'won\'t', 'isnt': 'isn\'t', 'arent': 'aren\'t',
        'thier': 'their', 'alot': 'a lot', 'noone': 'no one', 'eachother': 'each other',
      };
      Object.entries(fixes).forEach(([key, val]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        result = result.replace(regex, val);
      });
      // Fix double spaces & missing period
      result = result.replace(/\s{2,}/g, ' ').trim();
      if (result && !/[.!?]$/.test(result)) result += '.';
      return result;
    }
    default: return text;
  }
};

// ========================================================================
// ON-DEVICE PROFANITY FILTER ? Client-side content moderation
// No data leaves the device. Supports leet-speak normalization.
// ========================================================================
