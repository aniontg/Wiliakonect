const categories = [
  {
    name: "Local business",
    brand: "GOOD NEIGHBOUR",
    eyebrow: "A LITTLE CLOSER TO HOME",
    headline: "Good work, done with care.",
    description: "A thoughtful local team helping its neighbours with dependable service, personal attention, and a little extra care.",
    cta: "SAY HELLO",
    sections: [
      ["Here to help", "Discover friendly, dependable service shaped around the people and places in our community."],
      ["Made to feel easy", "From the first question to the final detail, we keep things clear, considered, and simple."],
      ["Around the corner", "Find out more about our work, meet the people behind it, and plan your next visit."],
    ],
  },
  {
    name: "Creative portfolio",
    brand: "STUDIO FORMS",
    eyebrow: "INDEPENDENT CREATIVE PRACTICE",
    headline: "Ideas with room to grow.",
    description: "A small creative practice bringing distinct ideas to life through thoughtful strategy, playful experimentation, and considered craft.",
    cta: "EXPLORE THE WORK",
    sections: [
      ["Selected work", "A collection of recent collaborations, each with its own character, challenge, and point of view."],
      ["The approach", "Curiosity first, collaboration always, and a healthy respect for the little details."],
      ["Make something together", "Have a project in mind? We would love to hear what you are dreaming up."],
    ],
  },
  {
    name: "Restaurant & café",
    brand: "THE OLIVE TABLE",
    eyebrow: "SEASONAL PLATES · GOOD COMPANY",
    headline: "Come hungry. Leave happy.",
    description: "A neighbourhood table for slow lunches, bright flavours, and evenings that are always better shared.",
    cta: "BOOK A TABLE",
    sections: [
      ["From the kitchen", "A changing menu inspired by seasonal ingredients, familiar favourites, and the joy of eating well."],
      ["Gather around", "A relaxed, welcoming space for a quick coffee, a long lunch, or a little celebration."],
      ["Find your table", "Take a look at our opening hours and get in touch to plan your next visit."],
    ],
  },
  {
    name: "Beauty & skincare",
    brand: "SOFT FORM STUDIO",
    eyebrow: "A MOMENT, JUST FOR YOU",
    headline: "Feel good in your own skin.",
    description: "A calm beauty studio offering considered treatments, thoughtful products, and a little time to reset.",
    cta: "BOOK YOUR MOMENT",
    sections: [
      ["The treatment menu", "Explore personalised treatments designed to help you feel refreshed, restored, and completely yourself."],
      ["A softer kind of care", "We take time to listen, explain every step, and make your visit feel comfortable."],
      ["Your time starts here", "Browse availability and get in touch when you are ready to find your new favourite ritual."],
    ],
  },
  {
    name: "Fitness & wellness",
    brand: "GOOD PACE CLUB",
    eyebrow: "MOVE WELL · FEEL MORE LIKE YOU",
    headline: "Find your own strong.",
    description: "A welcoming space for movement, mindful progress, and building a healthy routine that fits real life.",
    cta: "FIND YOUR CLASS",
    sections: [
      ["Move your way", "From first-timers to familiar faces, our sessions meet you where you are and help you go at your pace."],
      ["A community that moves", "Good energy, kind encouragement, and room to celebrate every kind of progress."],
      ["Start when you are ready", "See what is on this week and choose a class that feels right for you."],
    ],
  },
  {
    name: "Real estate",
    brand: "FIELD & HOME",
    eyebrow: "LOCAL KNOWLEDGE · PERSONAL SERVICE",
    headline: "A place for what comes next.",
    description: "Thoughtful property guidance for finding a home, making a move, or seeing new potential in a familiar place.",
    cta: "EXPLORE PROPERTIES",
    sections: [
      ["Find your place", "Explore a considered collection of homes and spaces, each with a story waiting to unfold."],
      ["A better way to move", "We listen closely, share honest advice, and stay beside you through every decision."],
      ["Let's talk it through", "Tell us what you are looking for and our local team will help you plan your next step."],
    ],
  },
  {
    name: "Online shop",
    brand: "OBJECT & ORIGIN",
    eyebrow: "USEFUL THINGS · MADE TO LAST",
    headline: "A few good things, chosen well.",
    description: "A little collection of everyday objects made with care, chosen for the way they work and the way they make you feel.",
    cta: "SHOP THE COLLECTION",
    sections: [
      ["Made with intention", "Meet independent makers and discover useful pieces with thoughtful materials and enduring design."],
      ["The everyday edit", "Small details, considered essentials, and new favourites to make your own."],
      ["Good things, delivered", "Find the details you need and get in touch if you would like a hand choosing."],
    ],
  },
  {
    name: "Travel & tourism",
    brand: "OPEN ROAD JOURNEYS",
    eyebrow: "GO A LITTLE FURTHER",
    headline: "Somewhere new is calling.",
    description: "Meaningful journeys for curious travellers, made around memorable places, local stories, and time well spent.",
    cta: "FIND YOUR JOURNEY",
    sections: [
      ["Places with a story", "Explore thoughtful trips shaped by the people, landscapes, and everyday moments that make a place special."],
      ["Travel your way", "We help you find the right pace, the right stops, and the details that turn a trip into your trip."],
      ["Let's start dreaming", "Share what inspires you and we will help you find a good place to begin."],
    ],
  },
  {
    name: "Education & learning",
    brand: "CURIOUS MINDS",
    eyebrow: "LEARNING THAT OPENS DOORS",
    headline: "A little curiosity goes a long way.",
    description: "A friendly learning community sharing practical lessons, fresh ideas, and support to help every learner grow.",
    cta: "EXPLORE CLASSES",
    sections: [
      ["Learn something new", "Find clear, engaging classes designed to make new skills feel useful from the very first lesson."],
      ["Room to grow", "Supportive teachers and a welcoming environment help every student take their next step with confidence."],
      ["Your next chapter", "Explore our programmes and get in touch to find the right place to begin."],
    ],
  },
  {
    name: "Healthcare & clinic",
    brand: "KINDRED HEALTH",
    eyebrow: "GOOD CARE STARTS WITH LISTENING",
    headline: "Care that sees the whole you.",
    description: "A welcoming care team offering thoughtful support, clear information, and time to talk through what matters.",
    cta: "MEET THE CARE TEAM",
    sections: [
      ["Care, made personal", "We take time to understand your needs and explain your options in a way that feels clear."],
      ["A team beside you", "Meet experienced practitioners who bring warmth, attention, and respect to every appointment."],
      ["Take the next step", "Find practical information about our services and how to arrange a conversation."],
    ],
  },
  {
    name: "Legal services",
    brand: "CLEARPATH LEGAL",
    eyebrow: "GOOD ADVICE · HUMAN APPROACH",
    headline: "Clarity for what comes next.",
    description: "Practical legal guidance delivered with care, plain language, and a focus on helping you move forward.",
    cta: "TALK TO OUR TEAM",
    sections: [
      ["Advice that makes sense", "We make complex matters easier to understand and help you see the options in front of you."],
      ["Experience on your side", "A considered, responsive team that takes the time to understand what a good outcome means to you."],
      ["A conversation is a start", "Tell us a little about what you need and we will explain how we can help."],
    ],
  },
  {
    name: "Finance & accounting",
    brand: "NORTHSTAR FINANCE",
    eyebrow: "CONFIDENT DECISIONS START HERE",
    headline: "Make sense of your next move.",
    description: "Friendly financial guidance and clear numbers for people and growing businesses planning what comes next.",
    cta: "LET'S TALK NUMBERS",
    sections: [
      ["A clearer picture", "Understand the numbers that matter with practical support designed around your goals."],
      ["Plan with confidence", "From everyday decisions to longer-term plans, we help you make your next step feel more certain."],
      ["Start a conversation", "Tell us what you are working towards and we will help you find a sensible way forward."],
    ],
  },
  {
    name: "Nonprofit & community",
    brand: "COMMON GROUND",
    eyebrow: "SMALL ACTIONS · SHARED FUTURES",
    headline: "Together, we make things better.",
    description: "A community-powered organisation bringing people together to create practical change where it matters most.",
    cta: "BE PART OF IT",
    sections: [
      ["Why we are here", "We work alongside our community to make more opportunities, stronger connections, and lasting change."],
      ["Good things happen together", "Meet the people, projects, and partners bringing our shared vision to life."],
      ["There is a place for you", "Give your time, share an idea, or help us reach more people in our community."],
    ],
  },
  {
    name: "Wedding & events",
    brand: "GATHER & GLOW",
    eyebrow: "MOMENTS WORTH REMEMBERING",
    headline: "A day that feels like you.",
    description: "Thoughtful event planning for joyful gatherings, personal details, and the kind of moments people remember.",
    cta: "PLAN YOUR DAY",
    sections: [
      ["Your story, your celebration", "We turn the things you love into a celebration that feels personal from the first hello."],
      ["The details, taken care of", "From the big picture to the finishing touches, we keep everything moving with calm attention."],
      ["Let's make a plan", "Tell us what you are imagining and we will help bring the pieces together."],
    ],
  },
  {
    name: "Photography",
    brand: "GOLDEN HOUR STUDIO",
    eyebrow: "REAL PEOPLE · BEAUTIFUL LIGHT",
    headline: "Hold on to how it felt.",
    description: "Honest, artful photography for the people, places, and everyday details you will want to remember.",
    cta: "VIEW THE GALLERY",
    sections: [
      ["Stories in photographs", "Explore a collection of natural moments, thoughtful portraits, and images made to feel like you."],
      ["Easy from the start", "A relaxed approach creates room for real connection and photographs that never feel forced."],
      ["Keep this moment", "Share a little about what you have in mind and we will plan something lovely together."],
    ],
  },
  {
    name: "Technology & software",
    brand: "BRIGHT SIGNAL",
    eyebrow: "USEFUL TECHNOLOGY · THOUGHTFULLY MADE",
    headline: "Make the complicated feel simple.",
    description: "A small technology team building clear, dependable digital tools that help people do their best work.",
    cta: "SEE WHAT WE BUILD",
    sections: [
      ["Technology with a purpose", "We focus on the everyday problems where a well-made digital tool can make a meaningful difference."],
      ["Built around people", "Our process starts with listening, stays open to feedback, and keeps the experience clear."],
      ["Bring us a challenge", "Tell us what you would like to make easier and let's explore what is possible."],
    ],
  },
  {
    name: "Home services",
    brand: "GOOD HANDS HOME",
    eyebrow: "TRUSTED HELP · RIGHT AROUND THE CORNER",
    headline: "A little help makes home.",
    description: "Reliable home services from a friendly local team who treats your space with care and keeps you in the loop.",
    cta: "REQUEST A VISIT",
    sections: [
      ["Help for your home", "Get dependable support for the jobs that make your home work a little better every day."],
      ["People you can trust", "We show up when we say we will, explain the work, and take care around your space."],
      ["Tell us what you need", "Share a few details and we will help you find a convenient time to get started."],
    ],
  },
  {
    name: "Fashion & apparel",
    brand: "FORM & THREAD",
    eyebrow: "EVERYDAY PIECES · PERSONAL STYLE",
    headline: "Wear what feels like you.",
    description: "Considered clothing and easy favourites made to move with you, feel good, and become part of your everyday.",
    cta: "EXPLORE THE EDIT",
    sections: [
      ["The new collection", "Meet versatile pieces made with thoughtful details, comfortable fits, and room to make them your own."],
      ["A little more considered", "We value careful design, responsible choices, and the lasting joy of wearing something often."],
      ["Find your fit", "Explore the collection or get in touch if you would like help finding a new favourite."],
    ],
  },
  {
    name: "Events & entertainment",
    brand: "GOOD NIGHT OUT",
    eyebrow: "BRING PEOPLE TOGETHER",
    headline: "Make room for a little magic.",
    description: "Live experiences, joyful gatherings, and brilliant nights out designed to make people feel part of something.",
    cta: "SEE WHAT'S ON",
    sections: [
      ["Find your next favourite", "Discover upcoming shows, gatherings, and experiences for a night worth looking forward to."],
      ["Made for sharing", "We bring great people, good ideas, and a thoughtful touch together in one place."],
      ["Come along", "Find the details you need and get in touch if you would like to make your event part of ours."],
    ],
  },
  {
    name: "Consulting & coaching",
    brand: "NEXT GOOD STEP",
    eyebrow: "FRESH PERSPECTIVE · PRACTICAL PROGRESS",
    headline: "Find a way forward that fits.",
    description: "Thoughtful coaching and practical advice to help people and teams get unstuck and move towards meaningful goals.",
    cta: "BOOK A FIRST CHAT",
    sections: [
      ["A little perspective", "Make space to ask better questions, see new possibilities, and get clear about what matters most."],
      ["Progress that feels possible", "Together, we turn big ambitions into practical next steps that work in the real world."],
      ["Start with a conversation", "Share what you are thinking about and find out whether we could be a good fit."],
    ],
  },
  {
    name: "Pet care",
    brand: "PAWS & COMPANY",
    eyebrow: "GOOD CARE FOR GOOD FRIENDS",
    headline: "More happy tails, every day.",
    description: "Warm, reliable care for the pets who make life better, with thoughtful updates and plenty of time for a cuddle.",
    cta: "MEET THE TEAM",
    sections: [
      ["Care shaped around them", "Every pet has their own personality. We take time to get to know what makes yours feel at home."],
      ["People who love animals", "Our friendly team brings patience, experience, and genuine care to every visit."],
      ["Let's meet your best friend", "Tell us a little about your pet and we will help you find the right kind of care."],
    ],
  },
  {
    name: "Automotive",
    brand: "GOOD MILE GARAGE",
    eyebrow: "STRAIGHTFORWARD CARE FOR YOUR CAR",
    headline: "Feel good about the road ahead.",
    description: "Honest vehicle care, practical advice, and skilled hands to help keep you and your car moving with confidence.",
    cta: "BOOK A CHECK-UP",
    sections: [
      ["The care you need", "From routine maintenance to a closer look, we help you understand what your vehicle needs and why."],
      ["Good people, good work", "Our team keeps things clear, answers your questions, and takes pride in every detail."],
      ["Keep moving", "Get in touch to talk through a concern or arrange a time that works for you."],
    ],
  },
  {
    name: "Agriculture & food",
    brand: "FIELD NOTES FARM",
    eyebrow: "GROWN WITH CARE · SHARED WITH YOU",
    headline: "Good things start in the soil.",
    description: "A small growing community sharing seasonal produce, thoughtful farming, and a closer connection to the land.",
    cta: "MEET THE FARM",
    sections: [
      ["Rooted in the season", "We grow with the land, follow the rhythm of the year, and make the most of what is ready now."],
      ["From our place to yours", "Discover the people, practices, and care behind the food we are proud to share."],
      ["Come a little closer", "Find out where to meet us, what is growing, and how to bring a little more local into your week."],
    ],
  },
  {
    name: "Music & audio",
    brand: "SOUND & SIGNAL",
    eyebrow: "FIND YOUR FREQUENCY",
    headline: "Turn the volume into a feeling.",
    description: "A creative home for music, sound, and live moments made to move people and bring a room to life.",
    cta: "LISTEN IN",
    sections: [
      ["The latest sound", "Listen to recent releases, live sessions, and the ideas taking shape in the studio."],
      ["Made to be heard", "We bring a curious ear and a collaborative spirit to every recording, mix, and performance."],
      ["Let's make some noise", "Tell us what you are working on and let's find the right sound together."],
    ],
  },
  {
    name: "Architecture & construction",
    brand: "STILLFORM BUILD",
    eyebrow: "GOOD SPACES · BUILT TO LAST",
    headline: "Make space for better living.",
    description: "A considered design and build team shaping useful, characterful spaces around the way people really live.",
    cta: "EXPLORE OUR WORK",
    sections: [
      ["Spaces with purpose", "Explore thoughtful projects shaped by light, material, context, and the people who use them."],
      ["Built together", "We listen first, share ideas clearly, and stay attentive from the first sketch to the final finish."],
      ["Imagine what is possible", "Tell us about a space you would love to change and we will help you find a place to begin."],
    ],
  },
];

const layouts = ["Split", "Centered", "Editorial", "Gallery", "Minimal"];
const motifs = ["Sunlit", "Botanical", "Coastal", "Terracotta", "Midnight", "Citrus", "Lavender", "Monochrome"];
const themeNames = { light: "Light", dark: "Dark", warm: "Warm", bold: "Bold" };
const styleCount = layouts.length * motifs.length;
const categoryImages = [
  ["photo-1486406146926-c627a92ad1ab", "A contemporary city building"],
  ["photo-1497366754035-f200968a6e72", "A bright creative studio"],
  ["photo-1414235077428-338989a2e8c0", "A beautifully plated dinner"],
  ["photo-1522335789203-aabd1fc54bc9", "A beauty and skincare collection"],
  ["photo-1517836357463-d25dfeac3438", "A person training in a studio"],
  ["photo-1600596542815-ffad4c1539a9", "A modern home surrounded by greenery"],
  ["photo-1490312278390-ab64016e0aa9", "A considered collection of everyday products"],
  ["photo-1464822759023-fed622ff2c3b", "A mountain landscape at sunrise"],
  ["photo-1503676260728-1c00da094a0b", "A student learning in a classroom"],
  ["photo-1576091160399-112ba8d25d1d", "A calm healthcare workspace"],
  ["photo-1589829545856-d10d557cf95f", "A row of books in a library"],
  ["photo-1460925895917-afdab827c52f", "A business analytics dashboard"],
  ["photo-1532629345422-7515f3d16bb6", "People supporting a community cause"],
  ["photo-1519741497674-611481863552", "A warmly lit wedding celebration"],
  ["photo-1452587925148-ce544e77e70d", "A camera ready to capture a moment"],
  ["photo-1518770660439-4636190af475", "Details of modern technology"],
  ["photo-1621905251918-48416bd8575a", "A skilled tradesperson at work"],
  ["photo-1483985988355-763728e1935b", "A fashion collection in a city"],
  ["photo-1492684223066-81342ee5ff30", "A lively event with colourful lights"],
  ["photo-1521737711867-e3b97375f902", "A team sharing ideas together"],
  ["photo-1450778869180-41d0601e046e", "A happy dog enjoying the outdoors"],
  ["photo-1492144534655-ae79c964c9d7", "A polished car in natural light"],
  ["photo-1500382017468-9049fed747ef", "Open fields in the late afternoon"],
  ["photo-1516280440614-37939bbacd81", "A musician performing on stage"],
  ["photo-1600607687939-ce8a6c25118c", "A carefully designed modern interior"],
];
const categoryImageAlternates = [
  [["photo-1441986300917-64674bd600d8", "A welcoming retail storefront"], ["photo-1517248135467-4c7edcad34c4", "A welcoming neighborhood space"]],
  [["photo-1523726491678-bf852e717f6a", "A designer working at a studio desk"], ["photo-1497366216548-37526070297c", "A collaborative creative workspace"]],
  [["photo-1517248135467-4c7edcad34c4", "A warm restaurant interior"], ["photo-1511920170033-f8396924c348", "Fresh coffee on a cafe counter"]],
  [["photo-1598440947619-2c35fc9aa908", "A calm skincare ritual"], ["photo-1534528741775-53994a69daeb", "A glowing beauty portrait"]],
  [["photo-1534438327276-14e5300c3a48", "A bright modern gym"], ["photo-1517836357463-d25dfeac3438", "A focused training session"]],
  [["photo-1600047509807-ba8f99d2cdde", "A welcoming contemporary home"], ["photo-1600585154340-be6161a56a0c", "A home framed by a landscaped garden"]],
  [["photo-1523275335684-37898b6baf30", "A considered everyday product"], ["photo-1542291026-7eec264c27ff", "A vivid product detail"]],
  [["photo-1500530855697-b586d89ba3ee", "A sunlit travel destination"], ["photo-1476514525535-07fb3b4ae5f1", "A quiet alpine lake"]],
  [["photo-1497633762265-9d179a990aa6", "Books ready for a learning session"], ["photo-1503676260728-1c00da094a0b", "A lively classroom"]],
  [["photo-1551601651-2a8555f1a136", "A welcoming healthcare consultation"], ["photo-1576091160399-112ba8d25d1d", "A clean and calm clinical space"]],
  [["photo-1450101499163-c8848c66ca85", "Legal documents on a desk"], ["photo-1521791136064-7986c2920216", "A professional client conversation"]],
  [["photo-1554224155-8d04cb21cd6c", "A person reviewing finances"], ["photo-1460925895917-afdab827c52f", "A clear financial dashboard"]],
  [["photo-1559027615-cd4628902d4a", "Community volunteers working together"], ["photo-1531206715517-5c0ba140b2b8", "A community group making a difference"]],
  [["photo-1519741497674-611481863552", "A warm wedding celebration"], ["photo-1511285560929-80b456fea0bc", "A couple celebrating their wedding"]],
  [["photo-1492691527719-9d1e07e534b4", "A photographer capturing a portrait"], ["photo-1452587925148-ce544e77e70d", "A camera ready to capture a moment"]],
  [["photo-1518770660439-4636190af475", "A close-up of modern technology"], ["photo-1519389950473-47ba0277781c", "A software team working together"]],
  [["photo-1621905251918-48416bd8575a", "A skilled home-service professional"], ["photo-1621905252507-b35492cc74b4", "A professional at a home installation"]],
  [["photo-1515886657613-9f3515b0c78f", "A contemporary street-style look"], ["photo-1483985988355-763728e1935b", "A fashion collection in the city"]],
  [["photo-1531058020387-3be344556be6", "A live event with colorful lights"], ["photo-1492684223066-81342ee5ff30", "A lively event under the lights"]],
  [["photo-1556761175-b413da4baf72", "A team sharing ideas around a table"], ["photo-1556761175-4b46a572b786", "A coaching session in progress"]],
  [["photo-1450778869180-41d0601e046e", "A happy dog enjoying the outdoors"], ["photo-1516734212186-a967f81ad0d7", "A dog out for a walk"]],
  [["photo-1492144534655-ae79c964c9d7", "A polished car in natural light"], ["photo-1503376780353-7e6692767b70", "A car on a scenic open road"]],
  [["photo-1500382017468-9049fed747ef", "Open fields in the late afternoon"], ["photo-1470252649378-9c29740c9fa8", "Golden light over a growing field"]],
  [["photo-1470229722913-7c0e2dbbafd3", "A musician performing beneath stage lights"], ["photo-1516280440614-37939bbacd81", "A live vocalist on stage"]],
  [["photo-1518005020951-eccb494ad742", "Sculptural contemporary architecture"], ["photo-1600566753086-00f18fb6b3ea", "A thoughtfully designed interior"]],
];
const categoryFocus = [
  ["local expertise", "find the right local team"], ["creative ideas", "bring an idea to life"],
  ["good food", "gather around the table"], ["everyday care", "feel good in your own skin"],
  ["feeling stronger", "move at your own pace"], ["finding your place", "find a place to call home"],
  ["everyday essentials", "find something you'll love"], ["meaningful journeys", "find somewhere new"],
  ["curious minds", "learn something new"], ["feeling better", "find thoughtful care"],
  ["clear next steps", "make a confident decision"], ["financial clarity", "make your money work for you"],
  ["community change", "make a difference together"], ["your big day", "celebrate your way"],
  ["your story", "keep a moment close"], ["better technology", "make technology work for you"],
  ["a cared-for home", "make your home work better"], ["personal style", "find your next favorite look"],
  ["memorable moments", "make a night of it"], ["meaningful progress", "take your next step"],
  ["happy pets", "give your best friend good care"], ["confidence on the road", "keep your car moving"],
  ["good food", "grow something good"], ["the right sound", "find your frequency"],
  ["better spaces", "make room for better living"],
];
const copyDirections = [
  (focus) => `A more thoughtful way to ${focus[1]}.`,
  (focus) => `Good ${focus[0]}, made personal.`,
  (focus) => `Make room for ${focus[0]}.`,
  (focus) => `Where ${focus[0]} meets a human touch.`,
  (focus) => `Your next chapter starts with ${focus[0]}.`,
  (focus) => `A little more ${focus[0]}, every day.`,
  (focus) => `Find your own way to ${focus[1]}.`,
];
const copyDescriptions = [
  (focus) => `Discover ${focus[0]} shaped around what matters to you, with thoughtful details and a clear next step.`,
  (focus) => `From the first hello to the finishing touches, find a welcoming way to ${focus[1]}.`,
  (focus) => `Explore a fresh perspective on ${focus[0]}, brought to life with care, clarity, and character.`,
  (focus) => `Thoughtful choices and a personal approach make it easier to ${focus[1]}.`,
];
const copyCtas = ["EXPLORE WHAT'S POSSIBLE", "FIND YOUR NEXT STEP", "LET'S GET STARTED", "DISCOVER MORE", "MAKE IT HAPPEN", "SEE WHAT'S NEW", "FIND OUT MORE"];
const themeCycle = ["light", "dark", "warm", "bold"];

export const templateCategories = categories.map((category) => category.name);
export const websiteTemplateCount = Math.min(1000, categories.length * styleCount);

export const websiteTemplates = categories.flatMap((category, categoryIndex) =>
  Array.from({ length: Math.floor(websiteTemplateCount / categories.length) }, (_, styleIndex) => {
    const designNumber = styleIndex + 1;
    const categoryNumber = categoryIndex + 1;
    const imageChoice = styleIndex % 3;
    const image = imageChoice === 0
      ? categoryImages[categoryIndex]
      : categoryImageAlternates[categoryIndex][imageChoice - 1];
    const design = `design-${String(designNumber).padStart(2, "0")}`;
    const layout = layouts[Math.floor(styleIndex / motifs.length)];
    const motif = motifs[styleIndex % motifs.length];
    const copyIndex = Math.floor(styleIndex / (copyDescriptions.length + 1));
    const descriptionIndex = styleIndex % (copyDescriptions.length + 1);
    const focus = categoryFocus[categoryIndex];
    const theme = themeCycle[styleIndex % themeCycle.length];
    const themeName = themeNames[theme];
    return {
      id: `${categoryNumber}-${designNumber}`,
      category: category.name,
      categoryIndex,
      design,
      layout,
      motif,
      theme,
      themeName,
      title: `${category.name} — ${layout} ${motif}`,
      filename: `${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${layout.toLowerCase()}-${motif.toLowerCase()}.html`,
      site: {
        brand: category.brand,
        eyebrow: copyIndex === 0
          ? category.eyebrow
          : `${focus[0].toUpperCase()} · MADE WITH CARE`,
        headline: copyIndex === 0
          ? category.headline
          : copyDirections[copyIndex - 1](focus),
        description: descriptionIndex === 0
          ? category.description
          : copyDescriptions[descriptionIndex - 1](focus),
        cta: copyIndex === 0
          ? category.cta
          : copyCtas[(copyIndex - 1) % copyCtas.length],
        email: "",
        templateDesign: design,
        heroImage: `https://images.unsplash.com/${image[0]}?auto=format&fit=crop&w=1500&q=85`,
        heroImageAlt: image[1],
        sections: category.sections.map(([heading, body]) => ({ heading, body })),
      },
    };
  }),
);
