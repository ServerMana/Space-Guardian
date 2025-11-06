import './state.js';
import './render.js';
import './logic.js';
import './ui.js';

// entry module: other modules initialize themselves and hook into the DOM
// Perform initial reset and a first render frame
import { state } from './state.js';
import { resetGame } from './logic.js';
import { fitCanvasToContainer, renderItemIcons } from './ui.js';
import { render } from './render.js';

resetGame();
if(state.ctx){ state.ctx.clearRect(0,0,state.W,state.H); render(); }
setTimeout(()=>{ try{ fitCanvasToContainer(); renderItemIcons(); }catch(e){} }, 60);