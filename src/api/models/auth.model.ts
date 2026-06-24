export interface LoginRequest {
  model: {
    RememberMe: boolean;
    ShowCaptcha: boolean;
    UserName: string;
    Password: string;
    Language: string;
    LatestBranchId: number;
  };
  IsManageSide: boolean;
  FingerPrintKey: string;
}

export interface LoginResponse {
  Token?: string;
  token?: string;
  AccessToken?: string;
  BranchId?: number;
  UserId?: number;
  UserName?: string;
}
