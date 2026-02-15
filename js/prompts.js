export const PROMPTS = [
  // ARC 1: FOUNDATIONS (Weeks 1-4)
  { week: 1,  title: 'Fresh Start',          description: 'Capture something that represents a new beginning.',                          tips: 'Look for morning light, empty paths, or open doors.' },
  { week: 2,  title: 'Everyday Object',       description: 'Find beauty in something you see every day but never photograph.',            tips: 'Try unusual angles or extreme close-ups.' },
  { week: 3,  title: 'Your Neighborhood',     description: 'Photograph your neighborhood as if seeing it for the first time.',            tips: 'Walk a route you normally drive. Notice textures and details.' },
  { week: 4,  title: 'Self Portrait',         description: 'Create a self portrait — literal or abstract.',                               tips: 'Shadows, reflections, and silhouettes all count.' },

  // ARC 2: LIGHT & SHADOW (Weeks 5-8)
  { week: 5,  title: 'Golden Hour',           description: 'Shoot during the first or last hour of sunlight.',                            tips: 'Face your subject toward the light, or shoot into it for silhouettes.' },
  { week: 6,  title: 'Hard Shadows',          description: 'Find and frame dramatic, hard-edged shadows.',                                tips: 'Midday sun creates the strongest shadows. Look for window light.' },
  { week: 7,  title: 'Low Light',             description: 'Photograph in minimal available light.',                                      tips: 'Embrace grain. Use walls or surfaces to stabilize your camera.' },
  { week: 8,  title: 'Backlit',               description: 'Position your light source behind your subject.',                             tips: 'Translucent subjects like leaves or fabric glow beautifully backlit.' },

  // ARC 3: COLOR & TONE (Weeks 9-12)
  { week: 9,  title: 'Monochrome',            description: 'See the world without color. Shoot or convert to black and white.',           tips: 'Strong contrast and textures work best in B&W.' },
  { week: 10, title: 'One Color',             description: 'Build a composition dominated by a single color.',                            tips: 'Red, blue, and yellow are easiest to find. Try to fill the frame.' },
  { week: 11, title: 'Complementary Colors',  description: 'Find two opposite colors together: blue/orange, red/green, yellow/purple.',   tips: 'Farmers markets and street scenes are rich with color contrast.' },
  { week: 12, title: 'Muted Tones',           description: 'Seek out soft, desaturated, quiet colors.',                                   tips: 'Overcast days, fog, and pastel surfaces work well.' },

  // ARC 4: COMPOSITION (Weeks 13-16)
  { week: 13, title: 'Rule of Thirds',        description: 'Place your subject precisely on a third-line intersection.',                   tips: 'Most cameras have a grid overlay option. Use it.' },
  { week: 14, title: 'Leading Lines',          description: 'Use lines in the scene to draw the eye into the frame.',                     tips: 'Roads, fences, rivers, shadows, and architecture all create lines.' },
  { week: 15, title: 'Frame Within a Frame',   description: 'Use doorways, windows, arches, or branches to frame your subject.',          tips: 'The frame can be sharp or soft. Experiment with depth of field.' },
  { week: 16, title: 'Negative Space',         description: 'Give your subject room to breathe with expansive empty space.',              tips: 'Minimalism is powerful. Sky, walls, and water make great negative space.' },

  // ARC 5: PERSPECTIVE (Weeks 17-20)
  { week: 17, title: 'From Below',             description: 'Get low and look up.',                                                       tips: 'Lie on the ground. Buildings, trees, and people look dramatic from below.' },
  { week: 18, title: 'Bird\'s Eye View',       description: 'Shoot directly downward from above your subject.',                           tips: 'Stairs, balconies, and bridges offer great vantage points.' },
  { week: 19, title: 'Through Something',      description: 'Photograph through glass, water, fabric, or any translucent material.',      tips: 'Raindrops, dirty windows, and prisms all distort interestingly.' },
  { week: 20, title: 'Reflection',             description: 'Use reflections as your primary subject or compositional element.',           tips: 'Puddles, mirrors, windows, sunglasses, phone screens.' },

  // ARC 6: TEXTURE & PATTERN (Weeks 21-24)
  { week: 21, title: 'Texture Close-Up',       description: 'Get close enough to feel the surface through the image.',                    tips: 'Sidelight reveals texture best. Try wood, stone, fabric, or skin.' },
  { week: 22, title: 'Repeating Pattern',      description: 'Find and frame a naturally occurring pattern.',                               tips: 'Architecture, nature, and crowds all contain patterns.' },
  { week: 23, title: 'Broken Pattern',         description: 'Find a pattern and then the element that breaks it.',                        tips: 'One red umbrella in a sea of black. One open window in a wall of closed ones.' },
  { week: 24, title: 'Natural Geometry',       description: 'Discover geometric shapes in nature.',                                        tips: 'Spirals in shells, hexagons in honeycombs, circles in flowers.' },

  // ARC 7: PEOPLE & STORIES (Weeks 25-28)
  { week: 25, title: 'Hands at Work',          description: 'Photograph hands doing something — any craft, task, or gesture.',            tips: 'Close crop. Show the action. Hands tell stories that faces sometimes cannot.' },
  { week: 26, title: 'Candid Moment',          description: 'Capture an unposed, genuine moment.',                                        tips: 'Be patient and ready. The best candids come from observation, not direction.' },
  { week: 27, title: 'Portrait of a Stranger', description: 'Photograph someone you do not know (with permission or from afar).',         tips: 'Street photography. Focus on interesting characters or gestures.' },
  { week: 28, title: 'Connection',             description: 'Show a connection between people, or between a person and something.',        tips: 'Look for eye contact, touch, shared laughter, or parallel gestures.' },

  // ARC 8: NATURE (Weeks 29-32)
  { week: 29, title: 'Water',                  description: 'Make water your subject — in any form.',                                     tips: 'Fast shutter freezes droplets. Slow shutter silks waterfalls.' },
  { week: 30, title: 'Weather',                description: 'Step outside in imperfect weather and photograph it.',                        tips: 'Rain, fog, wind, storms, and snow all create dramatic images.' },
  { week: 31, title: 'Flora',                  description: 'Photograph a plant, flower, or tree with intention.',                         tips: 'Isolate one bloom with shallow depth of field. Or show the entire canopy.' },
  { week: 32, title: 'Fauna',                  description: 'Capture an animal — pet, wild, or anywhere between.',                        tips: 'Get on their level. Eye-level shots of animals create empathy.' },

  // ARC 9: URBAN (Weeks 33-36)
  { week: 33, title: 'Architecture',           description: 'Find beauty in a building or structure.',                                     tips: 'Symmetry, converging verticals, and isolated details all work.' },
  { week: 34, title: 'Street Scene',           description: 'Capture the energy and story of a street.',                                   tips: 'Wait for the right person to walk into your composed frame.' },
  { week: 35, title: 'Signs & Typography',     description: 'Photograph interesting lettering, signage, or text in the wild.',             tips: 'Neon, hand-painted, old, decayed, or ironic signs.' },
  { week: 36, title: 'Night City',             description: 'Photograph your city or town after dark.',                                    tips: 'Use a surface to stabilize. Embrace the warm/cool color mix of artificial light.' },

  // ARC 10: ABSTRACT & CREATIVE (Weeks 37-40)
  { week: 37, title: 'Motion Blur',            description: 'Use a slow shutter to capture movement.',                                     tips: 'Pan with a moving subject for a sharp subject on blurred background.' },
  { week: 38, title: 'Minimalism',             description: 'Reduce your composition to the absolute essentials.',                         tips: 'One subject. One color. Maximum impact from minimum elements.' },
  { week: 39, title: 'Double Exposure',        description: 'Layer two images or find a natural double exposure.',                         tips: 'Many phones have multi-exposure modes. Or use reflections in glass.' },
  { week: 40, title: 'Abstract',               description: 'Make an image where the subject is unrecognizable.',                          tips: 'Extreme close-ups, intentional camera movement, or unusual processing.' },

  // ARC 11: EMOTION & MOOD (Weeks 41-44)
  { week: 41, title: 'Solitude',               description: 'Convey a feeling of being alone.',                                            tips: 'Empty spaces, single figures in vast landscapes, quiet corners.' },
  { week: 42, title: 'Joy',                    description: 'Capture pure, unfiltered happiness.',                                         tips: 'Children playing, celebrations, or the moment of a pleasant surprise.' },
  { week: 43, title: 'Tension',                description: 'Create visual tension or unease.',                                            tips: 'Tilted horizons, tight crops, dark tones, and unanswered visual questions.' },
  { week: 44, title: 'Nostalgia',              description: 'Evoke a memory or a longing for the past.',                                   tips: 'Old objects, faded colors, film-like grain, and vintage subjects.' },

  // ARC 12: CHALLENGE YOURSELF (Weeks 45-48)
  { week: 45, title: 'One Lens, One Hour',     description: 'Restrict yourself to one focal length for 60 minutes.',                       tips: 'Constraints breed creativity. On a phone, do not zoom at all.' },
  { week: 46, title: 'Unfamiliar Place',       description: 'Go somewhere you have never photographed before.',                            tips: 'A different neighborhood, a new trail, or even a different floor of a building.' },
  { week: 47, title: 'Recreate a Masterpiece', description: 'Recreate a famous photograph or painting in your own style.',                 tips: 'Study the original closely. Match the light and composition, not the subject.' },
  { week: 48, title: 'Photo a Day',            description: 'Take a photo every day this week, then choose your favorite.',                tips: 'Quantity leads to quality. Do not overthink each shot this week.' },

  // ARC 13: CULMINATION (Weeks 49-52)
  { week: 49, title: 'Your Style',             description: 'Shoot whatever you want in whatever style feels most you.',                   tips: 'Look back at your favorites from this challenge. What themes emerge?' },
  { week: 50, title: 'Gift',                   description: 'Make a photograph specifically to give to someone.',                          tips: 'Photograph something meaningful to them. Print it if you can.' },
  { week: 51, title: 'Transformation',         description: 'Photograph something in the process of changing.',                            tips: 'Seasons turning, construction, cooking, aging, sunrise to sunset.' },
  { week: 52, title: 'The Year in One Frame',  description: 'Create a single image that captures the spirit of your year.',                tips: 'This is your capstone. Take your time. Make it meaningful.' }
];

const ARC_NAMES = [
  'Foundations', 'Light & Shadow', 'Color & Tone', 'Composition',
  'Perspective', 'Texture & Pattern', 'People & Stories', 'Nature',
  'Urban', 'Abstract & Creative', 'Emotion & Mood', 'Challenge Yourself', 'Culmination'
];

export function getPromptForWeek(weekNumber) {
  return PROMPTS.find(p => p.week === weekNumber) || null;
}

export function getPromptArc(weekNumber) {
  const arcIndex = Math.floor((weekNumber - 1) / 4);
  return ARC_NAMES[arcIndex] || '';
}

export function getRandomPrompt(excludeWeek) {
  const candidates = PROMPTS.filter(p => p.week !== excludeWeek);
  return candidates[Math.floor(Math.random() * candidates.length)];
}