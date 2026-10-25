import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TeacherDirectoryItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  department: string;
  experience?: string;
  availability?: string;
}

export interface ClassTransferRequest {
  id: string;
  periodId: string;
  periodLabel: string;
  startTime: string;
  endTime: string;
  date: string;
  className: string;
  subject: string;
  room?: string;
  fromTeacherId: string;
  fromTeacherName: string;
  toTeacherId: string;
  toTeacherName: string;
  toTeacherSubject: string;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  responseNote?: string;
  createdAt: string;
  updatedAt: string;
}

// Comprehensive directory of teachers organized by subject
export const TEACHERS_DIRECTORY: TeacherDirectoryItem[] = [
  // Mathematics
  {
    id: 't-math-1',
    name: 'Mr. Rajesh Kumar',
    email: 'rajesh.kumar@school.edu',
    subject: 'Mathematics',
    department: 'Mathematics',
    experience: '8 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-math-2',
    name: 'Ms. Ananya Sharma',
    email: 'ananya.sharma@school.edu',
    subject: 'Mathematics',
    department: 'Mathematics',
    experience: '5 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-math-3',
    name: 'Dr. Vikram Seth',
    email: 'vikram.seth@school.edu',
    subject: 'Mathematics',
    department: 'Mathematics',
    experience: '12 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-math-4',
    name: 'Mrs. Priya Verma',
    email: 'priya.verma@school.edu',
    subject: 'Mathematics',
    department: 'Mathematics',
    experience: '6 yrs exp',
    availability: 'Free this period',
  },

  // Physics
  {
    id: 't-phy-1',
    name: 'Dr. Arvind Mehta',
    email: 'arvind.mehta@school.edu',
    subject: 'Physics',
    department: 'Science',
    experience: '10 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-phy-2',
    name: 'Ms. Pooja Nair',
    email: 'pooja.nair@school.edu',
    subject: 'Physics',
    department: 'Science',
    experience: '4 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-phy-3',
    name: 'Mr. Suresh Joshi',
    email: 'suresh.joshi@school.edu',
    subject: 'Physics',
    department: 'Science',
    experience: '7 yrs exp',
    availability: 'Free this period',
  },

  // Chemistry
  {
    id: 't-chem-1',
    name: 'Dr. Meenakshi Sundaram',
    email: 'meenakshi.s@school.edu',
    subject: 'Chemistry',
    department: 'Science',
    experience: '11 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-chem-2',
    name: 'Mr. Harish Chandra',
    email: 'harish.c@school.edu',
    subject: 'Chemistry',
    department: 'Science',
    experience: '6 yrs exp',
    availability: 'Free this period',
  },

  // Biology
  {
    id: 't-bio-1',
    name: 'Dr. Sunita Patil',
    email: 'sunita.patil@school.edu',
    subject: 'Biology',
    department: 'Science',
    experience: '9 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-bio-2',
    name: 'Ms. Deepa Rao',
    email: 'deepa.rao@school.edu',
    subject: 'Biology',
    department: 'Science',
    experience: '5 yrs exp',
    availability: 'Free this period',
  },

  // English
  {
    id: 't-eng-1',
    name: 'Mrs. Sarah Jenkins',
    email: 'sarah.jenkins@school.edu',
    subject: 'English',
    department: 'Languages',
    experience: '8 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-eng-2',
    name: 'Mr. Amit Roy',
    email: 'amit.roy@school.edu',
    subject: 'English',
    department: 'Languages',
    experience: '6 yrs exp',
    availability: 'Free this period',
  },

  // Social Science
  {
    id: 't-soc-1',
    name: 'Mr. K. N. Rao',
    email: 'kn.rao@school.edu',
    subject: 'Social Science',
    department: 'Social Studies',
    experience: '14 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-soc-2',
    name: 'Mrs. Geeta Menon',
    email: 'geeta.menon@school.edu',
    subject: 'Social Science',
    department: 'Social Studies',
    experience: '7 yrs exp',
    availability: 'Free this period',
  },

  // Computer Science
  {
    id: 't-cs-1',
    name: 'Mr. Nikhil Sharma',
    email: 'nikhil.sharma@school.edu',
    subject: 'Computer Science',
    department: 'Computer Science',
    experience: '5 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-cs-2',
    name: 'Ms. Ritika Shah',
    email: 'ritika.shah@school.edu',
    subject: 'Computer Science',
    department: 'Computer Science',
    experience: '4 yrs exp',
    availability: 'Free this period',
  },

  // Hindi
  {
    id: 't-hin-1',
    name: 'Mr. Manoj Tiwari',
    email: 'manoj.tiwari@school.edu',
    subject: 'Hindi',
    department: 'Languages',
    experience: '10 yrs exp',
    availability: 'Free this period',
  },
  {
    id: 't-hin-2',
    name: 'Mrs. Shobha Sharma',
    email: 'shobha.s@school.edu',
    subject: 'Hindi',
    department: 'Languages',
    experience: '8 yrs exp',
    availability: 'Free this period',
  },
];

// Helper to filter teachers ONLY by the subject of the class
export function getTeachersBySubject(subjectName: string): TeacherDirectoryItem[] {
  if (!subjectName) return [];
  const normalized = subjectName.trim().toLowerCase();

  const aliasMap: Record<string, string> = {
    maths: 'mathematics',
    math: 'mathematics',
    algebra: 'mathematics',
    geometry: 'mathematics',
    'practical geometry': 'mathematics',
    physics: 'physics',
    chemistry: 'chemistry',
    biology: 'biology',
    science: 'science',
    english: 'english',
    'english language': 'english',
    'english literature': 'english',
    'social science': 'social science',
    'social studies': 'social science',
    'computer science': 'computer science',
    'comp sci': 'computer science',
    it: 'computer science',
    hindi: 'hindi',
  };

  const targetCategory = aliasMap[normalized] || normalized;

  return TEACHERS_DIRECTORY.filter((t) => {
    const tSub = t.subject.toLowerCase();
    const tNormalized = aliasMap[tSub] || tSub;

    if (tNormalized === targetCategory) return true;
    if (targetCategory === 'science' && (tNormalized === 'physics' || tNormalized === 'chemistry' || tNormalized === 'biology')) {
      return true;
    }
    return tSub.includes(targetCategory) || targetCategory.includes(tSub);
  });
}

function getTodayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const INITIAL_REQUESTS: ClassTransferRequest[] = [
  {
    id: 'demo-req-incoming-1',
    periodId: 'demo-slot-incoming-6',
    periodLabel: '6th Period',
    startTime: '02:30 PM',
    endTime: '03:20 PM',
    date: getTodayIsoDate(),
    className: 'Class 9-B',
    subject: 'Maths',
    fromTeacherId: 't-math-4',
    fromTeacherName: 'Mrs. Priya Verma',
    toTeacherId: 'current-user',
    toTeacherName: 'You',
    toTeacherSubject: 'Mathematics',
    reason: 'Attending Faculty Workshop',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ClassTransferState {
  requests: ClassTransferRequest[];
  sendTransferRequest: (
    data: Omit<ClassTransferRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ) => ClassTransferRequest;
  respondToRequest: (
    requestId: string,
    status: 'accepted' | 'rejected',
    responseNote?: string
  ) => void;
  cancelTransferRequest: (requestId: string) => void;
  getTransferForPeriod: (
    periodId: string,
    date: string,
    periodLabel?: string
  ) => ClassTransferRequest | undefined;
}

export const useClassTransferStore = create<ClassTransferState>()(
  persist(
    (set, get) => ({
      requests: INITIAL_REQUESTS,

      sendTransferRequest: (data) => {
        const newReq: ClassTransferRequest = {
          ...data,
          id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          // Remove any previous pending transfer for this specific period/date before adding new
          requests: [
            newReq,
            ...state.requests.filter((r) => {
              const isSameSlot =
                (r.periodId && data.periodId && r.periodId === data.periodId) ||
                (Boolean(r.periodLabel) &&
                  Boolean(data.periodLabel) &&
                  r.periodLabel.trim().toLowerCase() === data.periodLabel.trim().toLowerCase());
              return !(isSameSlot && r.date === data.date && r.status === 'pending');
            }),
          ],
        }));

        return newReq;
      },

      respondToRequest: (requestId, status, responseNote) => {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status,
                  responseNote: responseNote || r.responseNote,
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      cancelTransferRequest: (requestId) => {
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== requestId),
        }));
      },

      getTransferForPeriod: (periodId, date, periodLabel) => {
        const { requests } = get();
        return requests.find(
          (r) =>
            r.date === date &&
            (r.status === 'pending' || r.status === 'accepted') &&
            (r.periodId === periodId ||
              (Boolean(periodLabel) && r.periodLabel?.toLowerCase() === periodLabel?.toLowerCase()) ||
              (Boolean(periodLabel) && r.periodLabel?.startsWith(periodLabel || '')))
        );
      },
    }),
    {
      name: 'schoolerp-class-transfers',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
