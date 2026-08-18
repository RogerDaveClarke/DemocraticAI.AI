declare module '@google-cloud/firestore' {
  export class Firestore {
    collection(name: string): any;
    batch(): any;
  }
}