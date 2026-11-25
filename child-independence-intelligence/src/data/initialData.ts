import {
  ChildProfile,
  Subject,
  LearningMaterial,
  TaskItem,
  ApprovedApp,
  YouTubeItem,
  ActivityLog,
  InterventionStats,
  EverydayRoutineItem,
  ResponsibilitySchedule,
  DailyObservation,
} from '../types';

export const initialEverydayRoutines: EverydayRoutineItem[] = [
  {
    id: 'rt-wake',
    task: 'Wake up',
    completeBy: '6:30 AM',
    frequency: 'Every day',
    isObservable: false,
    enabled: true,
    reportedStatus: 'child_reported',
    reportedValue: 'Reported by child: 6:45 AM',
    notes: 'Usually wakes up around 6:15–6:30 AM',
  },
  {
    id: 'rt-brush',
    task: 'Brush teeth',
    completeBy: '7:00 AM',
    frequency: 'Every day',
    isObservable: false,
    enabled: true,
    notes: 'Morning dental hygiene',
  },
  {
    id: 'rt-bath',
    task: 'Bath',
    completeBy: '8:00 AM',
    frequency: 'Every day',
    isObservable: false,
    enabled: true,
    notes: 'Morning refresh before school',
  },
  {
    id: 'rt-dress',
    task: 'Get dressed',
    completeBy: '8:15 AM',
    frequency: 'Every day',
    isObservable: false,
    enabled: true,
  },
  {
    id: 'rt-breakfast',
    task: 'Breakfast',
    completeBy: '8:30 AM',
    frequency: 'Every day',
    isObservable: false,
    enabled: true,
    reportedStatus: 'child_reported',
    reportedValue: 'Reported by child: Had breakfast at home',
  },
  {
    id: 'rt-bed',
    task: 'Make/organise bed',
    completeBy: '8:45 AM',
    frequency: 'Every day',
    isObservable: false,
    enabled: true,
  },
  {
    id: 'rt-belongings',
    task: 'Put belongings away',
    completeBy: '9:00 AM',
    frequency: 'Every day',
    isObservable: false,
    enabled: true,
    notes: 'Shoes on rack, school blazer hung up',
  },
  {
    id: 'rt-clothes',
    task: 'Fold clothes',
    completeBy: '9:00 AM',
    frequency: 'Every day',
    isObservable: false,
    enabled: true,
  },
  {
    id: 'rt-bag',
    task: 'Pack school bag',
    completeBy: '9:30 PM',
    frequency: 'Every day',
    isObservable: true,
    enabled: true,
    notes: 'Check books against tomorrow’s timetable',
  },
  {
    id: 'rt-timetable',
    task: 'Check timetable',
    completeBy: '9:30 PM',
    frequency: 'Every day',
    isObservable: true,
    enabled: true,
  },
  {
    id: 'rt-water',
    task: 'Prepare water bottle',
    completeBy: '9:30 PM',
    frequency: 'Every day',
    isObservable: false,
    enabled: true,
  },
];

export const initialOtherSchedules = [
  {
    id: 'sched-football',
    title: 'Football Practice',
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '16:00',
    endTime: '17:15',
    category: 'Sports' as const,
    locationOrDetail: 'Oakridge School Sports Ground',
    notes: 'Carry football cleats, shin guards, and water bottle.',
    enabled: true,
  },
  {
    id: 'sched-math-tuition',
    title: 'Maths Olympiad & Extension Tuition',
    days: ['Tue', 'Thu'],
    startTime: '18:15',
    endTime: '19:15',
    category: 'Tuition / Academic' as const,
    locationOrDetail: 'Home Study Desk (Online)',
    notes: 'Focus on algebra problem sets and geometry review.',
    enabled: true,
  },
  {
    id: 'sched-art-club',
    title: 'Weekend Sketching & Creative Arts Club',
    days: ['Sat'],
    startTime: '10:00',
    endTime: '11:30',
    category: 'Music & Arts' as const,
    locationOrDetail: 'Community Center Studio',
    notes: 'Bring sketchbook, 4B pencils, and watercolors.',
    enabled: true,
  },
  {
    id: 'sched-swimming',
    title: 'Swimming Squad Training',
    days: ['Sun'],
    startTime: '09:00',
    endTime: '10:00',
    category: 'Sports' as const,
    locationOrDetail: 'Club Aquatic Center',
    notes: 'Swim cap, goggles, towel.',
    enabled: true,
  },
];

export const initialChildProfile: ChildProfile = {
  name: 'Aarav',
  age: 13,
  grade: 'Grade 8',
  schoolName: 'Oakridge International School',
  schoolStartTime: '08:00',
  schoolEndTime: '15:00',
  wakeUpType: 'approximate',
  wakeUpTime: '06:30',
  wakeUpRange: 'Usually between 6:15 AM and 6:30 AM',
  bedtime: '22:00',
  avatar: '🚀',
  normalDayDescription:
    'Aarav usually wakes up around 6:30. He gets ready for school himself but sometimes needs reminders to pack his bag. He likes football and drawing. He usually gets home around 3 PM. He tends to watch TV when he comes home and sometimes loses track of time. He prefers studying Maths before Science.',
  everydayRoutines: initialEverydayRoutines,
  otherSchedules: initialOtherSchedules,
};

export const initialResponsibilitySchedule: ResponsibilitySchedule = {
  useSameWeekday: false,
  weekdayResponsibilities: [
    {
      id: 'resp-common-1',
      title: 'Complete Maths homework',
      category: 'Homework',
      expectedStart: '17:00',
      expectedCompletion: '18:00',
      durationMinutes: 45,
      priority: 'Important',
      notesForAI: 'Focus on exercises 1–10 from Chapter 4 in math notebook.',
      subjectId: 'math',
      materialIds: ['mat-math-ch4'],
      status: 'not_discussed',
    },
    {
      id: 'resp-common-2',
      title: 'Study Science & revision',
      category: 'Study',
      expectedStart: '20:00',
      expectedCompletion: '20:45',
      durationMinutes: 45,
      priority: 'Important',
      notesForAI: 'Review Biology Chapter 6 Life Processes: Photosynthesis equation and Digestive system.',
      subjectId: 'science',
      materialIds: ['mat-sci-ch6-photo', 'mat-sci-notes'],
      status: 'not_discussed',
    },
    {
      id: 'resp-common-3',
      title: 'Pack school bag for tomorrow',
      category: 'School preparation',
      expectedStart: '21:30',
      expectedCompletion: '21:45',
      durationMinutes: 15,
      priority: 'Normal',
      notesForAI: 'Prompt to check geometry box, timetable, and water bottle.',
      status: 'not_discussed',
    },
  ],
  dayResponsibilities: {
    monday: [
      {
        id: 'resp-mon-1',
        title: 'Maths homework',
        category: 'Homework',
        expectedStart: '17:00',
        expectedCompletion: '18:00',
        durationMinutes: 45,
        priority: 'Important',
        notesForAI: 'Focus on exercises 1–10 from Chapter 4.',
        subjectId: 'math',
        materialIds: ['mat-math-ch4'],
        status: 'not_discussed',
      },
      {
        id: 'resp-mon-2',
        title: 'Complete Science notes',
        category: 'Study',
        expectedStart: '20:00',
        expectedCompletion: '20:45',
        durationMinutes: 45,
        priority: 'Important',
        notesForAI: 'Review Life Processes and Alimentary Canal notes.',
        subjectId: 'science',
        materialIds: ['mat-sci-ch6-photo', 'mat-sci-notes'],
        status: 'not_discussed',
      },
      {
        id: 'resp-mon-3',
        title: 'Prepare school bag',
        category: 'School preparation',
        expectedStart: '21:30',
        expectedCompletion: '21:45',
        durationMinutes: 15,
        priority: 'Normal',
        notesForAI: 'Check timetable for Tuesday subjects.',
        status: 'not_discussed',
      },
    ],
    tuesday: [
      {
        id: 'resp-tue-1',
        title: 'Science notes review',
        category: 'Study',
        expectedStart: '17:00',
        expectedCompletion: '17:45',
        durationMinutes: 45,
        priority: 'Important',
        subjectId: 'science',
        status: 'not_discussed',
      },
      {
        id: 'resp-tue-2',
        title: 'English reading',
        category: 'Study',
        expectedStart: '19:00',
        expectedCompletion: '19:30',
        durationMinutes: 30,
        priority: 'Normal',
        subjectId: 'english',
        status: 'not_discussed',
      },
      {
        id: 'resp-tue-3',
        title: 'Fold clothes & put in wardrobe',
        category: 'Chore',
        expectedCompletion: '20:30',
        priority: 'Normal',
        status: 'not_discussed',
      },
    ],
    wednesday: [
      {
        id: 'resp-wed-1',
        title: 'Maths revision',
        category: 'Homework',
        expectedStart: '17:00',
        expectedCompletion: '18:00',
        durationMinutes: 45,
        priority: 'Important',
        subjectId: 'math',
        status: 'not_discussed',
      },
      {
        id: 'resp-wed-2',
        title: 'Clean study table',
        category: 'Personal responsibility',
        expectedCompletion: '19:30',
        priority: 'Normal',
        status: 'not_discussed',
      },
    ],
    thursday: [
      {
        id: 'resp-thu-1',
        title: 'Maths problem set',
        category: 'Homework',
        expectedStart: '17:00',
        expectedCompletion: '18:00',
        durationMinutes: 45,
        priority: 'Important',
        status: 'not_discussed',
      },
      {
        id: 'resp-thu-2',
        title: 'Football practice equipment clean',
        category: 'Personal responsibility',
        expectedCompletion: '19:00',
        priority: 'Normal',
        status: 'not_discussed',
      },
    ],
    friday: [
      {
        id: 'resp-fri-1',
        title: 'Clear school bag & file worksheets',
        category: 'School preparation',
        expectedCompletion: '16:30',
        priority: 'Normal',
        status: 'not_discussed',
      },
      {
        id: 'resp-fri-2',
        title: 'English creative writing outline',
        category: 'Homework',
        expectedStart: '17:30',
        expectedCompletion: '18:15',
        durationMinutes: 45,
        priority: 'Normal',
        status: 'not_discussed',
      },
    ],
    saturday: [
      {
        id: 'resp-sat-1',
        title: 'Creative drawing studio',
        category: 'Personal responsibility',
        expectedStart: '11:00',
        expectedCompletion: '11:45',
        durationMinutes: 45,
        priority: 'Normal',
        status: 'not_discussed',
      },
      {
        id: 'resp-sat-2',
        title: 'Maths puzzle & weekly challenge',
        category: 'Study',
        expectedStart: '16:00',
        expectedCompletion: '16:45',
        durationMinutes: 45,
        priority: 'Normal',
        status: 'not_discussed',
      },
    ],
    sunday: [
      {
        id: 'resp-sun-1',
        title: 'Organise bedroom & study books',
        category: 'Chore',
        expectedCompletion: '11:00',
        priority: 'Normal',
        status: 'not_discussed',
      },
      {
        id: 'resp-sun-2',
        title: 'Prepare uniforms & bag for Monday',
        category: 'School preparation',
        expectedCompletion: '19:30',
        priority: 'Important',
        status: 'not_discussed',
      },
    ],
  },
};

export const initialDailyObservations: DailyObservation[] = [
  {
    id: 'obs-1',
    time: '3:00 PM',
    source: 'child_reported',
    title: 'Returned home from school',
    detail: 'Child reported getting home at 3:00 PM',
    category: 'after_school',
  },
  {
    id: 'obs-2',
    time: '3:00 PM – 5:00 PM',
    source: 'child_reported',
    title: 'Watched TV after school',
    detail: 'Child reported watching TV after arriving home until 5:00 PM',
    category: 'after_school',
  },
  {
    id: 'obs-3',
    time: '6:45 AM',
    source: 'child_reported',
    title: 'Morning wake-up',
    detail: 'Reported by child: 6:45 AM (Expected: 6:30 AM)',
    category: 'routine',
  },
  {
    id: 'obs-4',
    time: '8:15 AM',
    source: 'child_reported',
    title: 'Had breakfast',
    detail: 'Reported by child: Had breakfast at home',
    category: 'routine',
  },
  {
    id: 'obs-5',
    time: '5:05 PM',
    source: 'platform_observed',
    title: 'Science study session started',
    detail: 'Child independently chose Chapter 6 Life Processes without parent reminder',
    category: 'learning',
  },
  {
    id: 'obs-6',
    time: '5:17 PM',
    source: 'platform_observed',
    title: 'Session paused (child reported bored)',
    detail: 'Completed 12 minutes reading aloud & 2 comprehension questions. Child stopped and said they were bored.',
    category: 'learning',
  },
  {
    id: 'obs-7',
    time: '5:00 PM – 6:00 PM',
    source: 'parent_configured',
    title: 'Maths homework expected window',
    detail: 'Exercises 1–10 from Chapter 4 (Status: Not started yet)',
    category: 'responsibility',
  },
];

export const initialSubjects: Subject[] = [
  { id: 'math', name: 'Mathematics', color: '#3b82f6', iconName: 'Calculator' },
  { id: 'science', name: 'Science', color: '#10b981', iconName: 'Atom' },
  { id: 'english', name: 'English', color: '#f59e0b', iconName: 'BookOpen' },
  { id: 'social', name: 'Social Studies', color: '#8b5cf6', iconName: 'Globe' },
];

export const initialMaterials: LearningMaterial[] = [
  {
    id: 'mat-math-ch4',
    subjectId: 'math',
    chapter: 'Chapter 4: Linear Equations in One Variable',
    topic: 'Solving Linear Equations & Word Problems',
    type: 'pdf',
    title: 'Chapter 4: Linear Equations & Exercises 1–10',
    contentText: `CHAPTER 4: LINEAR EQUATIONS IN ONE VARIABLE
4.1 Introduction:
An equation is a statement of equality between two mathematical expressions consisting of variables and constants.
A linear equation has the highest power of the variable as 1. General form: ax + b = c.

4.2 Rules of Transposition & Balancing:
1. Adding or subtracting the same number from both sides maintains equality.
2. Multiplying or dividing both sides by a non-zero number maintains equality.
3. Transposing a term with (+) sign to the other side changes it to (-).
4. Transposing a term with (×) sign to the other side changes it to (÷).

4.3 Practice Exercises (1 to 10):
Question 1: Solve for x: 3x - 5 = 16
Question 2: Solve: 5(2x - 1) = 3(x + 4)
Question 3: Two numbers are in the ratio 5:3. If they differ by 18, what are the numbers?
Question 4: Solve: 7x - 9 = 16
Question 5: A number added to its two-thirds is equal to 35. Find the original number.
(Hint for Q5: Let the unknown number be x. The two-thirds of x is (2/3)x. Set up the equation: x + (2/3)x = 35. Combine like terms: (5/3)x = 35. Multiply both sides by 3/5 to isolate x).
Question 6: The sum of three consecutive multiples of 8 is 888. Find the multiples.
Question 7: Solve for y: (y - 3)/5 = (y + 1)/7
Question 8: A perimeter of a rectangle is 13 cm and its width is 2 3/4 cm. Find its length.
Question 9: Solve: 8x + 4 = 3(x - 1) + 7
Question 10: Fifteen years from now, Ravi's age will be four times his present age. What is Ravi's present age?`,
    summary: 'Rules for solving linear equations, transposition methods, and questions 1 through 10 with hints.',
    createdAt: '2026-09-08T10:00:00Z',
  },
  {
    id: 'mat-sci-ch6-photo',
    subjectId: 'science',
    chapter: 'Biology — Chapter 6: Life Processes',
    topic: 'Photosynthesis & Autotrophic Nutrition',
    type: 'photo',
    title: 'Textbook Page 84: Photosynthesis & Chloroplasts',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80',
    contentText: `CHAPTER 6: LIFE PROCESSES — NUTRITION IN PLANTS
6.1 Autotrophic Nutrition:
Green plants synthesize their own food through the process of Photosynthesis.
Chemical equation:
6 CO2 + 6 H2O + Sunlight (absorbed by chlorophyll) ---> C6H12O6 (Glucose) + 6 O2

Key Events occurring during photosynthesis:
1. Absorption of light energy by chlorophyll pigments located inside chloroplasts.
2. Conversion of light energy to chemical energy and splitting of water molecules (H2O) into hydrogen and oxygen (photolysis).
3. Reduction of carbon dioxide (CO2) to carbohydrates (glucose).

Note on Stomata:
Massive amounts of gaseous exchange take place in the leaves through stomatal pores for the purpose of photosynthesis. Guard cells regulate the opening and closing of stomata by swelling when water flows into them.`,
    summary: 'Core chemical equation for photosynthesis, light vs dark reactions, chlorophyll function, and stomatal gas exchange.',
    createdAt: '2026-09-09T14:30:00Z',
  },
  {
    id: 'mat-sci-notes',
    subjectId: 'science',
    chapter: 'Biology — Chapter 6: Life Processes',
    topic: 'Human Digestive System Notes',
    type: 'notes',
    title: "Aarav's Class Notes: Alimentary Canal Overview",
    contentText: `CLASS NOTES — HUMAN DIGESTIVE SYSTEM:
1. Mouth / Buccal Cavity: Teeth grind food, Salivary Amylase breaks down starch into simple sugars (maltose).
2. Esophagus: Transports food bolus via rhythmic peristaltic contractions (no chemical digestion).
3. Stomach: Secretes gastric juice containing Hydrochloric acid (creates acidic pH ~1.5-2 to kill bacteria & activate pepsin), Pepsin (breaks proteins into peptides), and Mucus (protects stomach lining).
4. Small Intestine (Site of complete digestion):
   - Receives bile from liver (emulsifies fats from large globules to small droplets; neutralizes acidic chyme).
   - Receives pancreatic juice (trypsin for proteins, lipase for emulsified fats).
   - Villi: Finger-like projections in intestinal wall richly supplied with blood vessels to absorb nutrients.
5. Large Intestine: Absorbs excess water and salts; unabsorbed waste eliminated through rectum and anus.`,
    summary: 'Handwritten class summary on digestion enzymes, stomach acid, and nutrient absorption via villi.',
    createdAt: '2026-09-10T09:15:00Z',
  },
  {
    id: 'mat-math-link',
    subjectId: 'math',
    chapter: 'Chapter 4: Linear Equations in One Variable',
    topic: 'Interactive Visual Equations',
    type: 'link',
    title: 'Khan Academy: Linear Equations Interactive Module',
    url: 'https://www.khanacademy.org/math/in-in-grade-8-ncert/x9e31a293:linear-equations-in-one-variable',
    contentText: 'Interactive balance scale model where adding or subtracting weights from both sides demonstrates algebraic equality.',
    summary: 'External practice modules and balance simulator.',
    createdAt: '2026-09-07T16:00:00Z',
  },
];

export const initialTasks: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Complete Mathematics homework',
    subjectId: 'math',
    category: 'Homework',
    startTime: '17:00',
    endTime: '18:00',
    frequency: 'Daily',
    instructions: 'Complete exercises 1–10 from Chapter 4 in your math notebook.',
    materialIds: ['mat-math-ch4'],
    status: 'pending',
    startMode: 'independent',
    remindersGiven: 0,
    durationMinutes: 45,
  },
  {
    id: 'task-2',
    title: 'Free time & creative play',
    category: 'Exercise',
    startTime: '18:00',
    endTime: '19:00',
    frequency: 'Daily',
    instructions: 'Draw something cool, watch approved videos, or stretch and play outdoors.',
    status: 'pending',
    remindersGiven: 0,
    durationMinutes: 60,
  },
  {
    id: 'task-3',
    title: 'Family dinner',
    category: 'Personal responsibility',
    startTime: '19:30',
    endTime: '20:00',
    frequency: 'Daily',
    instructions: 'Help set the dinner table and eat together.',
    status: 'pending',
    remindersGiven: 0,
    durationMinutes: 30,
  },
  {
    id: 'task-4',
    title: 'Science study & revision',
    subjectId: 'science',
    category: 'Study',
    startTime: '20:00',
    endTime: '21:00',
    frequency: 'Daily',
    instructions: 'Review Biology: Photosynthesis equation and Digestive system stages.',
    materialIds: ['mat-sci-ch6-photo', 'mat-sci-notes'],
    status: 'pending',
    remindersGiven: 0,
    durationMinutes: 45,
  },
  {
    id: 'task-5',
    title: 'Prepare school bag for tomorrow',
    category: 'School preparation',
    startTime: '21:30',
    endTime: '22:00',
    frequency: 'Daily',
    instructions: 'Pack books according to tomorrow’s timetable, check geometry box, water bottle.',
    status: 'pending',
    remindersGiven: 0,
    durationMinutes: 15,
  },
];

export const initialApprovedApps: ApprovedApp[] = [
  {
    id: 'app-youtube',
    name: 'YouTube Kids / Watch',
    category: 'Media & Exploration',
    iconName: 'PlaySquare',
    allowed: true,
    description: 'Parent-curated educational & inspiring channels (Mark Rober, Kurzgesagt, Math Antics).',
    internalTool: 'youtube',
  },
  {
    id: 'app-draw',
    name: 'Drawing Studio',
    category: 'Creative Expression',
    iconName: 'Palette',
    allowed: true,
    description: 'Freeform digital sketchpad with colors, brushes, and stickers.',
    internalTool: 'drawing',
  },
  {
    id: 'app-ai-tutor',
    name: 'AI Learning Guide',
    category: 'Learning & Homework',
    iconName: 'Sparkles',
    allowed: true,
    description: 'Friendly Socratic tutor grounded in Aarav’s actual school materials.',
    internalTool: 'chat',
  },
  {
    id: 'app-calc',
    name: 'Math Calculator',
    category: 'Utility',
    iconName: 'Calculator',
    allowed: true,
    description: 'Interactive scientific & standard calculation assistant.',
    internalTool: 'calculator',
  },
  {
    id: 'app-reading',
    name: 'Reading Nook',
    category: 'Reading',
    iconName: 'BookMarked',
    allowed: true,
    description: 'Curated science, mystery, and inspiring short stories.',
    internalTool: 'reading',
  },
];

export const approvedYouTubeVideos: YouTubeItem[] = [
  {
    id: 'yt-1',
    title: 'How Plants Make Food (Photosynthesis Explained simply)',
    channel: 'SciShow Kids & Teens',
    videoId: 'UPBMG5EYydo',
    thumbnail: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=500&q=80',
    duration: '6:12',
    subject: 'Science',
  },
  {
    id: 'yt-2',
    title: 'Algebra Basics: Solving 2-Step Equations',
    channel: 'Math Antics',
    videoId: 'LDIiYKYvvdA',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&q=80',
    duration: '10:29',
    subject: 'Mathematics',
  },
  {
    id: 'yt-3',
    title: 'What Happens When You Swallow Food? The Alimentary Journey',
    channel: 'Kurzgesagt – In a Nutshell',
    videoId: 'g8r_g_c0o2k',
    thumbnail: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&q=80',
    duration: '9:45',
    subject: 'Science',
  },
  {
    id: 'yt-4',
    title: 'World’s Largest Jello Pool! Science Experiment',
    channel: 'Mark Rober',
    videoId: 'eS-USr47YgA',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80',
    duration: '11:18',
    subject: 'Curiosity & Engineering',
  },
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-10T15:32:00Z',
    type: 'app_used',
    title: 'Logged in after school',
    details: 'Shared about football match in school chat',
    initiatedBy: 'child',
  },
  {
    id: 'log-2',
    timestamp: '2026-09-10T15:45:00Z',
    type: 'app_used',
    title: 'Used Drawing Studio',
    durationMinutes: 20,
    initiatedBy: 'child',
  },
  {
    id: 'log-3',
    timestamp: '2026-09-10T16:15:00Z',
    type: 'learning_help',
    title: 'Asked AI tutor about Photosynthesis equation',
    details: 'Discussed why sunlight and chlorophyll are necessary',
    initiatedBy: 'child',
  },
];

export const initialInterventionStats: InterventionStats = {
  todayParentReminders: 0,
  todayChildInitiated: 2,
  todayCompleted: 1,
  weeklyTrend: {
    lastWeekReminders: 14,
    thisWeekReminders: 9,
    days: [
      { day: 'Mon', childInitiated: 3, parentReminders: 2 },
      { day: 'Tue', childInitiated: 4, parentReminders: 1 },
      { day: 'Wed', childInitiated: 4, parentReminders: 1 },
      { day: 'Thu', childInitiated: 5, parentReminders: 0 },
      { day: 'Fri', childInitiated: 3, parentReminders: 2 },
      { day: 'Sat', childInitiated: 4, parentReminders: 1 },
      { day: 'Sun', childInitiated: 5, parentReminders: 0 },
    ],
  },
};
