/**
 * Board Module - Dashboard
 */

import { db, auth, collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from '../../firebase.js';

export function initBoard() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="board-container">
      <h1>Dashboard funguje!</h1>
      <p>Firebase: ${db ? 'OK' : 'ERROR'}</p>
      <p>User: ${auth.currentUser?.email || 'Not signed in'}</p>
    </div>
  `;
}
