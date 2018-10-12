import { REMOTE_ACTION, hashState, Keys } from "@cardcore/util";

export default function createGameMiddleware(gameActions, clientActions) {
  const { clientFetch, clientPoll, clientNext } = clientActions;

  return function gameMiddleware(store) {
    return next => {
      return async action => {
        // Hacky, but we need this in the store before anything.

        // First thing first... implement thunk.
        if (typeof action === "function") {
          return action(store.dispatch, store.getState);
        }

        // Next... if it's not a game action, pass through as a promise.
        if (!gameActions[action.type]) {
          return Promise.resolve(next(action));
        }

        // Okay, it's a game action. Great! Let's handle some special cases first.

        // Special case: we're loading the state from the server. Pass through.

        // Resolve the action.
        const prevState = store.getState();
        const me = prevState.client.keys.id;
        let prevHash = null;
        // Special case until we have an actual blockchain to build on
        if (action.type !== gameActions.CREATE_GAME) {
          prevHash = hashState(prevState);
        }
        if (!action[REMOTE_ACTION]) {
          action = {
            ...action,
            agent: me,
            prev: prevHash
          };
        } else {
          if (action.prev !== prevHash) {
            throw new Error(`hash mismatch, ${action.next} !== ${nextHash}`);
          }
        }
        next(action);
        const nextState = store.getState();
        const nextHash = hashState(nextState);

        if (action[REMOTE_ACTION]) {
          if (action.next !== nextHash) {
            throw new Error(`hash mismatch, ${action.next} !== ${nextHash}`);
          }
        } else {
          action = {
            ...action,
            next: nextHash
          };
        }

        // Resolved. Are we the user making this action? Neato! Let's tell the server about it.
        if (!action[REMOTE_ACTION]) {
          const signedAction = Keys.signAction(prevState, action);
          let res;
          try {
            res = await store.dispatch(
              clientFetch(`/${encodeURIComponent(nextHash)}`, {
                method: "POST",
                body: signedAction,
                headers: {
                  "content-type": "application/json"
                }
              })
            );
          } catch (e) {
            throw new Error(
              "Failed to create an action. We should probably handle this error."
            );
          }
          if (!res.ok) {
            throw new Error(await res.text());
          }
        }

        // Are we _not_ the user making this action? Okay, let's verify it.
        else {
          if (!Keys.verifyAction(prevState, action)) {
            throw new Error(
              `Remote action failed to verify: ${JSON.stringify(action)}`
            );
          }
        }

        await store.dispatch(clientNext());
        store.dispatch(clientPoll());
      };
    };
  };
}
