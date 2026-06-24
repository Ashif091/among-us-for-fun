/**
 * Hardcoded fallback word lists organized by category.
 * Used when the Datamuse API is unavailable or returns no results.
 */
export const WORD_LISTS: Record<string, string[]> = {
  fruits: [
    'apple', 'banana', 'mango', 'strawberry', 'pineapple', 'watermelon',
    'grape', 'cherry', 'peach', 'kiwi', 'papaya', 'coconut', 'blueberry',
    'raspberry', 'pomegranate', 'lemon', 'lime', 'orange', 'plum',
    'avocado', 'fig', 'guava', 'lychee', 'dragonfruit', 'passionfruit',
    'apricot', 'cantaloupe', 'honeydew', 'tangerine', 'grapefruit',
  ],
  animals: [
    'lion', 'elephant', 'penguin', 'dolphin', 'eagle', 'tiger', 'panda',
    'wolf', 'rabbit', 'koala', 'giraffe', 'zebra', 'kangaroo', 'octopus',
    'cheetah', 'whale', 'flamingo', 'parrot', 'chameleon', 'gorilla',
    'otter', 'hedgehog', 'peacock', 'jaguar', 'seahorse', 'raccoon',
    'armadillo', 'sloth', 'lynx', 'falcon',
  ],
  electronics: [
    'phone', 'laptop', 'headphones', 'tablet', 'smartwatch', 'television',
    'camera', 'speaker', 'microphone', 'keyboard', 'mouse', 'monitor',
    'printer', 'router', 'charger', 'earbuds', 'projector', 'console',
    'drone', 'calculator', 'flashlight', 'thermostat', 'remote',
    'hard drive', 'power bank', 'webcam', 'joystick', 'modem', 'scanner',
    'stylus',
  ],
  vehicles: [
    'bicycle', 'motorcycle', 'truck', 'airplane', 'helicopter', 'boat',
    'submarine', 'skateboard', 'scooter', 'train', 'tram', 'bus',
    'ambulance', 'taxi', 'yacht', 'canoe', 'spaceship', 'jetski',
    'rickshaw', 'hovercraft', 'gondola', 'bulldozer', 'crane', 'tractor',
    'limousine', 'convertible', 'minivan', 'sedan', 'pickup', 'moped',
  ],
  sports: [
    'football', 'basketball', 'tennis', 'swimming', 'cricket', 'hockey',
    'volleyball', 'badminton', 'baseball', 'golf', 'boxing', 'wrestling',
    'skiing', 'surfing', 'karate', 'archery', 'fencing', 'rugby',
    'cycling', 'skating', 'bowling', 'gymnastics', 'rowing', 'polo',
    'handball', 'squash', 'diving', 'climbing', 'triathlon', 'marathon',
  ],
  colors: [
    'crimson', 'turquoise', 'amber', 'emerald', 'violet', 'magenta',
    'ivory', 'coral', 'burgundy', 'teal', 'lavender', 'maroon', 'indigo',
    'gold', 'silver', 'bronze', 'sapphire', 'scarlet', 'chartreuse',
    'periwinkle', 'mauve', 'sienna', 'khaki', 'cerulean', 'fuchsia',
    'rust', 'plum', 'olive', 'peach', 'aquamarine',
  ],
  countries: [
    'japan', 'brazil', 'norway', 'australia', 'canada', 'mexico', 'egypt',
    'france', 'germany', 'italy', 'spain', 'india', 'china', 'russia',
    'argentina', 'kenya', 'thailand', 'greece', 'portugal', 'iceland',
    'switzerland', 'morocco', 'colombia', 'vietnam', 'turkey', 'ireland',
    'sweden', 'peru', 'cuba', 'nepal',
  ],
  food: [
    'pizza', 'sushi', 'burger', 'pasta', 'tacos', 'ramen', 'pancakes',
    'sandwich', 'nachos', 'croissant', 'biryani', 'dumplings', 'curry',
    'steak', 'spaghetti', 'burrito', 'kebab', 'lasagna', 'paella',
    'waffles', 'omelette', 'falafel', 'pho', 'risotto', 'gyoza',
    'tiramisu', 'churros', 'muffin', 'brownie', 'cheesecake',
  ],
  clothing: [
    'jacket', 'sneakers', 'hat', 'scarf', 'gloves', 'boots', 'dress',
    'hoodie', 'jeans', 'shorts', 'sweater', 'blazer', 'sandals', 'belt',
    'sunglasses', 'socks', 'tie', 'vest', 'raincoat', 'cardigan',
    'beanie', 'tracksuit', 'parka', 'overalls', 'kimono', 'poncho',
    'leggings', 'cape', 'tunic', 'crocs',
  ],
  instruments: [
    'guitar', 'piano', 'drums', 'violin', 'flute', 'trumpet', 'saxophone',
    'cello', 'harp', 'ukulele', 'accordion', 'harmonica', 'trombone',
    'clarinet', 'banjo', 'xylophone', 'tambourine', 'bagpipes', 'sitar',
    'maracas', 'bongos', 'mandolin', 'organ', 'oboe', 'bassoon',
    'tuba', 'djembe', 'kazoo', 'didgeridoo', 'tabla',
  ],
  objects: [
    'bottle', 'chair', 'umbrella', 'mirror', 'clock', 'lamp', 'candle',
    'pillow', 'scissors', 'hammer', 'envelope', 'compass', 'bucket',
    'ladder', 'telescope', 'whistle', 'magnifier', 'globe', 'key',
    'bell', 'paintbrush', 'dice', 'trophy', 'medal', 'backpack',
    'lantern', 'fan', 'vase', 'binoculars', 'hourglass',
  ],
  movies: [
    'titanic', 'inception', 'avatar', 'gladiator', 'interstellar',
    'joker', 'parasite', 'frozen', 'coco', 'up', 'jaws', 'rocky',
    'psycho', 'bambi', 'alien', 'cars', 'brave', 'her', 'ratatouille',
    'aladdin', 'mulan', 'moana', 'shrek', 'bolt', 'passengers',
    'arrival', 'dunkirk', 'gravity', 'spotlight', 'lion',
  ],
};

/** Returns all available category names */
export function getCategories(): string[] {
  return Object.keys(WORD_LISTS);
}
