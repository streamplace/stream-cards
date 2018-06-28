import { SEED_RNG } from "./seed-rng";
import { START_TURN } from "./turns";
import { DRAW_CARD } from "./draw-card";
import { SHUFFLE_DECK } from "./shuffle-deck";
import { getStandardDeck, getStandardEmoji } from "../../standard";
import rando from "../../random-util";
import { range, uid } from "../../util";

export const JOIN_GAME_START = "JOIN_GAME_START";
export const joinGameStart = () => {
  return {
    type: JOIN_GAME_START
  };
};
export const JOIN_GAME_ACCEPT = "JOIN_GAME_ACCEPT";
export const ORDER_PLAYERS = "ORDER_PLAYERS";
export const START_GAME = "START_GAME";

const INITIAL_PLAYER = {
  mana: 0,
  availableMana: 0,
  hand: [],
  field: [],
  graveyard: [],
  fatigue: 1
};

export function startGameReducer(state, action) {
  if (action.type === JOIN_GAME_START) {
    // On this one, clear out both the nextActions queue and the players list... this is the first
    // person joining. Everyone else joins with JOIN_GAME_ACCEPT
    return {
      ...state,
      game: {
        ...state.game,
        players: {
          [action._sender]: {}
        },
        nextActions: [
          {
            action: { type: JOIN_GAME_ACCEPT },
            // lol lol lol hack hack hack
            notPlayerId: action._sender
          }
        ]
      }
    };
  }

  if (action.type === JOIN_GAME_ACCEPT) {
    let lexicalPlayers = [
      ...Object.keys(state.game.players),
      action._sender
    ].sort();
    return {
      ...state,
      game: {
        ...state.game,
        players: {
          ...state.game.players,
          [action._sender]: {}
        },
        nextActions: [
          {
            playerId: lexicalPlayers[0],
            action: {
              type: SEED_RNG
            }
          },
          {
            playerId: lexicalPlayers[0],
            action: {
              type: ORDER_PLAYERS
            }
          }
        ]
      }
    };
  }

  if (action.type === ORDER_PLAYERS) {
    const playerOrder = rando.shuffle(Object.keys(state.game.players).sort());
    return {
      ...state,
      game: {
        ...state.game,
        playerOrder: playerOrder,
        turn: playerOrder[0],
        nextActions: [
          ...playerOrder.map(playerId => ({
            playerId,
            action: { type: START_GAME }
          })),
          {
            playerId: playerOrder[0],
            action: {
              type: START_TURN
            }
          },
          ...state.game.nextActions
        ]
      }
    };
  }

  if (action.type === START_GAME) {
    const playerOrder = state.game.playerOrder;
    const newUnits = {};
    const playerUnitId = uid();
    const deck = [];
    newUnits[playerUnitId] = {
      emoji: getStandardEmoji()[playerOrder.indexOf(action._sender)],
      health: 30,
      attack: 0,
      mana: 0
    };
    for (const card of getStandardDeck()) {
      const id = uid();
      newUnits[id] = { ...card };
      deck.push(id);
    }
    return {
      ...state,
      game: {
        ...state.game,
        units: {
          ...state.game.units,
          ...newUnits
        },
        players: {
          ...state.game.players,
          [action._sender]: {
            ...INITIAL_PLAYER,
            unitId: playerUnitId,
            deck
          }
        },
        nextActions: [
          {
            playerId: action._sender,
            action: {
              type: SHUFFLE_DECK,
              playerId: action._sender
            }
          },
          ...range(state.game.params.startDraw).map(() => ({
            playerId: action._sender,
            action: {
              type: DRAW_CARD,
              target: {
                player: action._sender
              }
            }
          })),
          ...state.game.nextActions
        ]
      }
    };
  }

  return state;
}