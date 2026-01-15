export interface Server {
  name: string;
  subtext: string;
  icon?: string;
  host: string;
  port: number;
  joins: number;
  admin_made: boolean;
}
export interface JoinedHistoryServer {
  id: string;
  joined: Date;
}

("");
