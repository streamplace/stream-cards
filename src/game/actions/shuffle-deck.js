import { rotateArray } from "../../util";
import { shuffle } from "../../random-util";
import { clientGenerateKey, clientBox } from "../../client-actions";
import ssbKeys from "ssb-keys";

export const SHUFFLE_DECK = "SHUFFLE_DECK";
// export const shuffleDeckAction = action => (dispatch, getState) => {
//   dispatch(action);
// };

export const SHUFFLE_DECK_ENCRYPT = "SHUFFLE_DECK_ENCRYPT";
export const shuffleDeckEncryptAction = action => async (
  dispatch,
  getState
) => {
  let encryptedDeck = [];
  for (const card of getState().game.players[action.playerId].deck) {
    const { keys } = await dispatch(clientGenerateKey());
    encryptedDeck.push(await dispatch(clientBox(card, keys)));
  }
  return dispatch({
    ...action,
    deck: shuffle(encryptedDeck)
  });
};

// for now this operates on the first card in someone's hand... maybe that's okay.
export const SHUFFLE_DECK_DECRYPT = "SHUFFLE_DECK_DECRYPT";
export const shuffleDeckDecryptAction = action => (dispatch, getState) => {
  const state = getState();
  const encryptedCard = state.game.players[action.playerId].hand[0];
  const keys = state.secret[encryptedCard.id];
  dispatch({
    ...action,
    private: keys.private
  });
};

export const shuffleDeckReducer = (state, action) => {
  if (action.type === SHUFFLE_DECK) {
    const encryptOrder = rotateArray(state.game.playerOrder, action.playerId);
    return {
      ...state,
      game: {
        ...state.game,
        nextActions: [
          ...encryptOrder.map(playerId => {
            return {
              playerId,
              action: {
                type: SHUFFLE_DECK_ENCRYPT,
                playerId: action.playerId
              }
            };
          }),
          ...state.game.nextActions
        ]
      }
    };
  }

  if (action.type === SHUFFLE_DECK_ENCRYPT) {
    return {
      ...state,
      game: {
        ...state.game,
        players: {
          ...state.game.players,
          [action.playerId]: {
            ...state.game.players[action.playerId],
            deck: action.deck
          }
        }
      }
    };
  }

  if (action.type === SHUFFLE_DECK_DECRYPT) {
    return {
      ...state,
      game: {
        ...state.game,
        players: {
          ...state.game.players,
          [action.playerId]: {
            ...state.game.players[action.playerId],
            hand: [
              ssbKeys.unbox(state.game.players[action.playerId].hand[0].box, {
                private: action.private
              }),
              ...state.game.players[action.playerId].hand.slice(1)
            ]
          }
        }
      }
    };
  }

  return state;
};
