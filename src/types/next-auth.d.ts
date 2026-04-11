import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id:                    string;
      roles:                 string[];
      hasActiveSubscription: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?:                string;
    roles?:                 string[];
    hasActiveSubscription?: boolean;
  }
}
