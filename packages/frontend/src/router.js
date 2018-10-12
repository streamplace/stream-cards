import React from "react";
import {
  Router as ReactRouter,
  Route,
  RouteSwitch,
  bootstrap,
  View
} from "@cardcore/elements";
import Board from "./board";
import FrontPage from "./front-page";
import GameProvider from "./game-provider";

export default class Router extends React.Component {
  constructor() {
    super();
    this.state = {
      ready: false
    };
  }

  async componentDidMount() {
    await bootstrap();
    this.setState({ ready: true });
  }

  render() {
    if (!this.state.ready) {
      return <View />;
    }
    return (
      <ReactRouter>
        <RouteSwitch>
          <Route
            path="/game/:gameId"
            render={props => (
              <GameProvider key="foo">
                <Board {...props} gameId={props.match.params.gameId} />
              </GameProvider>
            )}
          />
          <Route
            path="/"
            render={props => (
              <GameProvider key="bar">
                <FrontPage {...props} />
              </GameProvider>
            )}
          />
        </RouteSwitch>
      </ReactRouter>
    );
  }
}
