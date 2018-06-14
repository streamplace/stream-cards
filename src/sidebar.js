import React from "react";
import styled from "styled-components";
import Card from "./card";
import Deck from "./deck";
import { connect } from "react-redux";
import Face from "./face";

const SidebarVert = styled.div`
  display: flex;
  flex-grow: 1;
  flex-basis: 0;
  flex-direction: column;
`;

const ManaBox = styled.div`
  flex-shrink: 1;
  flex-grow: 0;
  font-size: 35px;
  height: 45px;
`;

const SidebarBox = styled.div`
  background-color: #aaa;
  flex-grow: 1;
  display: flex;
  padding: 10px;
`;

const HandBox = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: center;
`;

export class Sidebar extends React.Component {
  render() {
    return (
      <SidebarVert>
        <SidebarBox>
          <Face playerId={this.props.playerId} />
          <HandBox>
            {this.props.player.hand.map((card, i) => {
              return (
                <Card
                  card={card}
                  key={i}
                  location="hand"
                  playerId={this.props.playerId}
                />
              );
            })}
          </HandBox>
          <Deck playerId={this.props.playerId} />
        </SidebarBox>
      </SidebarVert>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    player: state.game.players[props.playerId]
  };
};

export default connect(mapStateToProps)(Sidebar);
