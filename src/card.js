import React from "react";
import styled from "styled-components";
import { cardDrop } from "./client-actions";
import { attack } from "./game/actions";
import { connect } from "react-redux";
import { registerDropTarget, clientPickTarget } from "./client-actions";
import { traverseSecret } from "./util";

export const CardBox = styled.div`
  border: 1px solid #555;
  user-select: none;
  border-radius: 10px;
  margin-left: 10px;
  margin-right: 10px;
  position: relative;
  width: 130px;
  transition: transform 500ms ease;
  transform: rotateY(0deg);
  transform-style: preserve-3d;
  z-index: 0;

  ${props => props.canPlay && cardGlow("5px", "blue")};
  ${props => props.flipped && "transform: rotateY(180deg)"};
  ${props => props.canPlay && "cursor: pointer"};
`;

export const CardBack = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: #36c;
  background: linear-gradient(
        115deg,
        transparent 75%,
        rgba(255, 255, 255, 0.8) 75%
      )
      0 0,
    linear-gradient(245deg, transparent 75%, rgba(255, 255, 255, 0.8) 75%) 0 0,
    linear-gradient(115deg, transparent 75%, rgba(255, 255, 255, 0.8) 75%) 7px -15px,
    linear-gradient(245deg, transparent 75%, rgba(255, 255, 255, 0.8) 75%) 7px -15px,
    #36c;
  background-size: 15px 30px;
  height: 100%;
  backface-visibility: hidden;
  z-index: 1;
  transform: rotateY(180deg);
  border-radius: 10px;
`;

export const CardContents = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0px;
  left: 0px;
  backface-visibility: hidden;
  background-color: white;
  transform: rotateY(0deg);
  z-index: 1;
  border-radius: 10px;
`;

export const cardGlow = (size, color) => `
  box-shadow:
    ${size} ${size} ${size} ${color},
    -${size} -${size} ${size} ${color},
    ${size} -${size} ${size} ${color},
    -${size} ${size} ${size} ${color}
`;

const Name = styled.div`
  position: absolute;
  width: 100%;
  text-align: center;
  top: 35px;
  display: flex;
  flex-direction: column;
`;
const NameText = styled.span`
  font-style: italic;
`;
const CardText = styled.span`
  font-size: 0.7em;
`;
export const Number = styled.span`
  position: absolute;
  font-size: 2em;
  font-weight: bold;
`;
const Attack = styled(Number)`
  bottom: 0;
  left: 5px;
`;
const Health = styled(Number)`
  bottom: 0;
  right: 5px;
`;
const Cost = styled(Number)`
  top: 0;
  right: 5px;
`;
const Type = styled(Number)`
  top: 0;
  left: 5px;
`;
const Emoji = styled.div`
  position: absolute;
  width: 100%;
  text-align: center;
  left: 0;
  top: 56px;
`;
const EmojiText = styled.span`
  font-size: 75px;
`;

export class Card extends React.Component {
  onDragEnd(e) {
    this.props.dispatch(cardDrop(e, this.props.unitId, this.props.location));
  }

  handleDrop({ unitId, location }) {
    if (location !== "field" || this.props.location !== "field") {
      return;
    }
    if (unitId === this.props.unitId) {
      return;
    }
    this.props.dispatch(attack(unitId, this.props.unitId));
  }
  handleClick(e) {
    if (this.props.targetingUnit && this.shouldLightUp()) {
      this.props.dispatch(clientPickTarget(this.props.unitId));
    }
  }
  shouldLightUp() {
    const onSummon = this.props.targetingUnit.onSummon[
      this.props.targets.length
    ];
    if (!onSummon) {
      return false;
    }
    const target = onSummon.target;
    if (this.props.location !== target.location) {
      return false;
    } else if (this.props.card.type !== target.type) {
      return false;
    } else {
      return true;
    }
  }

  isPlayable() {
    if (!this.props.myTurn) {
      return false;
    }
    if (!this.props.unit) {
      return false;
    }
    if (!this.props.myUnit) {
      return false;
    }
    if (this.props.location === "hand") {
      if (this.props.player.availableMana < this.props.unit.cost) {
        return false;
      }
    } else if (this.props.location === "field") {
      if (!this.unit.canAttack) {
        return false;
      }
    }
    return true;
  }

  render() {
    let card;
    let draggable = this.isPlayable();
    let shouldLightUp = draggable;
    const flipped = !this.props.unit;
    if (this.props.unit) {
      card = this.props.unit;
      if (this.props.targetingUnit) {
        shouldLightUp = this.shouldLightUp();
      }
    } else {
      card = {
        name: "",
        text: "",
        emoji: "",
        attack: "",
        health: "",
        cost: ""
      };
    }

    return (
      <CardBox
        innerRef={registerDropTarget(e => this.handleDrop(e))}
        canPlay={shouldLightUp}
        draggable={draggable}
        onClick={e => this.handleClick(e)}
        onDragEnd={e => this.onDragEnd(e)}
        flipped={flipped}
      >
        <CardBack />
        <CardContents>
          <Type>👾</Type>
          <Name>
            <NameText>
              {card.name} {draggable}
            </NameText>
            <CardText>{card.text}</CardText>
          </Name>
          <Emoji>
            <EmojiText>{card.emoji}</EmojiText>
          </Emoji>
          <Attack>{card.attack}⚔️</Attack>
          <Health>{card.health}♥️</Health>
          <Cost>{card.cost}💎</Cost>
        </CardContents>
      </CardBox>
    );
  }
}

const mapStateToProps = (state, props) => {
  const unitId = traverseSecret(props.card, state.secret);
  let unit;
  if (unitId) {
    unit = state.game.units[unitId];
  }
  console.log(state.client.keys.id, state.game.turn);
  return {
    unit: unit,
    unitId: unitId,
    targetingUnit: state.client.targetingUnit,
    targets: state.client.targets,
    secret: state.secret,
    player: state.game.players[props.playerId],
    myTurn: state.client.keys.id === state.game.turn,
    myUnit: state.client.keys.id === props.playerId
  };
};

export default connect(mapStateToProps)(Card);
