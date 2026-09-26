export const gradients = [
  'bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500',
  'bg-gradient-to-br from-blue-600 to-cyan-400',
  'bg-gradient-to-tr from-emerald-400 to-cyan-500',
  'bg-gradient-to-br from-rose-500 to-orange-400',
  'bg-gradient-to-bl from-zinc-800 via-zinc-900 to-black',
];

export const E = (hex) => String.fromCodePoint(parseInt(hex, 16));

export const EMOJI_CATEGORIES = [
  { id: 'smileys', icon: E('1F600'), name: 'Smileys & People', emojis: [E('1F600'),E('1F602'),E('1F970'),E('1F60E'),E('1F913'),E('1F62D'),E('1F621'),E('1F44D'),E('1F64F'),E('1F525'),E('2728'),E('1F4AF'),E('1F64C'),E('1F44F'),E('1F496'),E('1F643'),E('1F644'),E('1F634')] },
  { id: 'animals', icon: E('1F436'), name: 'Animals & Nature', emojis: [E('1F436'),E('1F431'),E('1F98A'),E('1F43C'),E('1F981'),E('1F42F'),E('1F438'),E('1F435'),E('1F414'),E('1F427'),E('1F985'),E('1F424'),E('1F434'),E('1F984'),E('1F40D'),E('1F98B'),E('1F338'),E('1F31F')] },
  { id: 'food', icon: E('1F34E'), name: 'Food & Drink', emojis: [E('1F34E'),E('1F354'),E('1F355'),E('1F32E'),E('1F363'),E('1F369'),E('2615'),E('1F37A'),E('1F951'),E('1F966'),E('1F968'),E('1F969'),E('1F95E'),E('1F9C7'),E('1F35F'),E('1F377'),E('1F379'),E('1F349')] },
  { id: 'activities', icon: E('26BD'), name: 'Activities', emojis: [E('26BD'),E('1F3C0'),E('1F3C8'),E('1F3BE'),E('1F3AE'),E('1F3B8'),E('1F3B5'),E('1F3A8'),E('1F9E9'),E('1F3B3'),E('1F94A'),E('1F3D2'),E('1F3F8'),E('1F94B'),E('1F945'),E('1F3BF'),E('1F3C2'),E('1F3C6')] },
  { id: 'travel', icon: E('1F697'), name: 'Travel & Places', emojis: [E('1F697'),E('1F695'),E('2708'),E('1F680'),E('1F6A2'),E('1F3D6'),E('1F5FD'),E('1F5FC'),E('1F682'),E('1F68D'),E('1F6F6'),E('26F5'),E('1F6F3'),E('1F3A1'),E('1F3A2'),E('1F3D4'),E('1F3D5'),E('1F5FA')] },
  { id: 'objects', icon: E('1F4A1'), name: 'Objects', emojis: [E('231A'),E('1F4F1'),E('1F4BB'),E('1F4F7'),E('1F4A1'),E('1F4DA'),E('1F381'),E('1F388'),E('1F48E'),E('1F570'),E('1F4FA'),E('1F4FB'),E('1F4C0'),E('1F4FC'),E('1F50B'),E('1F6D2'),E('1FA84'),E('1F6D2')] },
];

export const QUICK_REACTIONS = [E('1F44D'), E('2764'), E('1F602'), E('1F62E'), E('1F622'), E('1F64F')];
