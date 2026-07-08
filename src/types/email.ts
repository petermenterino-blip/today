export interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  body: string;
  variables: string[];
  updated_at: string;
}
