// import { supabase } from "./supabase";
// import type {
//   ApiResponse,
//   RealtimePayload,
// } from "@/components/types/supabase-common-types";

// export const authApi = {
//   // Sign up with email and password
//   signUp: async (email: string, password: string): Promise<ApiResponse> => {
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//     });
//     return { data, error };
//   },

//   // Sign in with email and password
//   signIn: async (email: string, password: string): Promise<ApiResponse> => {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });
//     return { data, error };
//   },

//   // Sign out
//   signOut: async (): Promise<{ error: Error | null }> => {
//     const { error } = await supabase.auth.signOut();
//     return { error };
//   },

//   // Get current user
//   //   getCurrentUser: async (): Promise<ApiResponse> => {
//   //     const {
//   //       data: { user },
//   //       error,
//   //     } = await supabase.auth.getUser();
//   //     return { user, error };
//   //   },

//   // Reset password
//   resetPassword: async (email: string): Promise<ApiResponse> => {
//     const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
//       redirectTo: `${window.location.origin}/reset-password`,
//     });
//     return { data, error };
//   },
// };

// // Database APIs
// export const dbApi = {
//   // Example: Get all records from a table
//   getAll: async <T>(tableName: string): Promise<ApiResponse<T[]>> => {
//     const { data, error } = await supabase.from(tableName).select("*");
//     return { data, error };
//   },

//   // Example: Get record by ID
//   getById: async <T>(
//     tableName: string,
//     id: string
//   ): Promise<ApiResponse<T>> => {
//     const { data, error } = await supabase
//       .from(tableName)
//       .select("*")
//       .eq("id", id)
//       .single();
//     return { data, error };
//   },

//   // Example: Insert new record
//   insert: async <T>(
//     tableName: string,
//     record: Partial<T>
//   ): Promise<ApiResponse<T[]>> => {
//     const { data, error } = await supabase
//       .from(tableName)
//       .insert(record)
//       .select();
//     return { data, error };
//   },

//   // Example: Update record
//   update: async <T>(
//     tableName: string,
//     id: string,
//     updates: Partial<T>
//   ): Promise<ApiResponse<T[]>> => {
//     const { data, error } = await supabase
//       .from(tableName)
//       .update(updates)
//       .eq("id", id)
//       .select();
//     return { data, error };
//   },

//   // Example: Delete record
//   delete: async (tableName: string, id: string): Promise<ApiResponse> => {
//     const { data, error } = await supabase
//       .from(tableName)
//       .delete()
//       .eq("id", id);
//     return { data, error };
//   },
// };

// // Storage APIs
// export const storageApi = {
//   // Upload file
//   uploadFile: async (
//     bucket: string,
//     path: string,
//     file: File
//   ): Promise<ApiResponse> => {
//     const { data, error } = await supabase.storage
//       .from(bucket)
//       .upload(path, file);
//     return { data, error };
//   },

//   // Download file
//   downloadFile: async (bucket: string, path: string): Promise<ApiResponse> => {
//     const { data, error } = await supabase.storage.from(bucket).download(path);
//     return { data, error };
//   },

//   // Get public URL
//   getPublicUrl: (bucket: string, path: string): string => {
//     const { data } = supabase.storage.from(bucket).getPublicUrl(path);
//     return data.publicUrl;
//   },

//   // Delete file
//   deleteFile: async (bucket: string, paths: string[]): Promise<ApiResponse> => {
//     const { data, error } = await supabase.storage.from(bucket).remove(paths);
//     return { data, error };
//   },
// };

// // Real-time subscriptions
// // export const realtimeApi = {
// //   // Subscribe to table changes
// //   subscribeToTable: <T>(
// //     tableName: string,
// //     callback: (payload: RealtimePayload<T>) => void
// //   ) => {
// //     return supabase
// //       .channel(`public:${tableName}`)
// //       .on(
// //         "postgres_changes",
// //         { event: "*", schema: "public", table: tableName },
// //         callback
// //       )
// //       .subscribe();
// //   },

// //   // Unsubscribe from channel
// //   unsubscribe: (subscription: ReturnType<typeof supabase.channel>) => {
// //     return supabase.removeChannel(subscription);
// //   },
// // };
