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


export function getTeachersBySubject(_subjectName: string): TeacherDirectoryItem[] {
  return [];
}

function getTodayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const INITIAL_REQUESTS: ClassTransferRequest[] = [];

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
