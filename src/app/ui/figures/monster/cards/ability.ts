import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Ability } from 'src/app/game/model/Ability';
import { PopupComponent } from 'src/app/ui/popup/popup';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'ghs-monster-ability',
  templateUrl: './ability.html',
  styleUrls: [ '../../../popup/popup.scss', './ability.scss' ]
})
export class MonsterAbilityComponent extends PopupComponent {

  @Input() monster!: Monster;
  @Input() index: number = -1;
  @ViewChild('menu') menuElement!: ElementRef;
  reveal: number = 0;

  ability: Ability | undefined = undefined;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edit: boolean = false;
  cardPopup: boolean = false;
  maxHeight: string = "";

  flipped(): boolean {
    if (this.index == -1) {
      this.ability = gameManager.monsterManager.getAbility(this.monster);
    } else {
      this.ability = gameManager.abilities(this.monster)[ this.index ];
    }
    return gameManager.roundManager.working && gameManager.game.state == GameState.draw || !gameManager.roundManager.working && gameManager.game.state == GameState.next && this.ability != undefined && this.monster.entities.filter((monsterEntity) => !monsterEntity.dead).length > 0;
  }

  toggleEdit() {
    this.edit = !this.edit;
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 0);
  }

  override doubleClickCallback(): void {
    if (this.flipped()) {
      this.cardPopup = true;
      this.openPopup();
    }
  }

  upcomingCards(): Ability[] {
    return this.monster.abilities.filter((value, index) => index > this.monster.ability).map((value) => gameManager.abilities(this.monster)[ value ]);
  }

  disgardedCards(): Ability[] {
    return this.monster.abilities.filter((value, index) => index <= this.monster.ability).map((value) => gameManager.abilities(this.monster)[ value ]).reverse();
  }

  abilityIndex(ability: Ability) {
    return gameManager.abilities(this.monster).indexOf(ability);
  }

  shuffle() {
    gameManager.stateManager.before("shuffleAbilityDeck", "data.monster." + this.monster.name);
    gameManager.monsterManager.shuffleAbilities(this.monster);
    gameManager.stateManager.after();
  }

  draw() {
    gameManager.stateManager.before("drawAbility", "data.monster." + this.monster.name);
    gameManager.monsterManager.drawAbility(this.monster);
    gameManager.stateManager.after();
  }

  override close(): void {
    super.close();
    this.reveal = 0;
    this.cardPopup = false;
  }

  toggleDrawExtra() {
    if (this.monster.drawExtra) {
      gameManager.stateManager.before("unsetDrawExtraAbility", "data.monster." + this.monster.name);
      this.monster.drawExtra = false;
      gameManager.monsterManager.applySameDeck(this.monster);
      gameManager.stateManager.after();
    } else if (gameManager.monsterManager.applySameDeck(this.monster)) {
      gameManager.stateManager.before("setDrawExtraAbility", "data.monster." + this.monster.name);
      this.monster.drawExtra = true;
      if (gameManager.game.state == GameState.next) {
        gameManager.monsterManager.drawExtra(this.monster);
      }
      gameManager.stateManager.after();
    }
  }

  dropUpcoming(event: CdkDragDrop<Ability[]>) {
    gameManager.stateManager.before("reorderAbilities", "data.monster." + this.monster.name);
    if (event.container == event.previousContainer) {
      const offset = this.monster.ability + 1;
      moveItemInArray(this.monster.abilities, event.previousIndex + offset, event.currentIndex + offset);
    } else {
      const offset = this.monster.ability;
      moveItemInArray(this.monster.abilities, offset - event.previousIndex, event.currentIndex + offset);
      this.monster.ability = this.monster.ability - 1;
    }
    gameManager.stateManager.after();
  }

  dropDisgarded(event: CdkDragDrop<Ability[]>) {
    gameManager.stateManager.before("reorderAbilities", "data.monster." + this.monster.name);
    if (event.container == event.previousContainer) {
      moveItemInArray(this.monster.abilities, this.monster.ability - event.previousIndex, this.monster.ability - event.currentIndex);
    } else {
      this.monster.ability = this.monster.ability + 1;
      const offset = this.monster.ability;
      moveItemInArray(this.monster.abilities, event.previousIndex + offset, offset - event.currentIndex);
    }
    gameManager.stateManager.after();
  }

  restoreDefault(): void {
    gameManager.stateManager.before("restoreDefaultAbilities", "data.monster." + this.monster.name);
    const abilities = gameManager.abilities(this.monster);
    this.monster.abilities = abilities.filter((ability) => !ability.level || isNaN(+ability.level) || ability.level <= this.monster.level).map((ability, index) => index);
    this.monster.ability = -1;
    gameManager.stateManager.after();
  }

  remove(index: number) {
    const ability: Ability = gameManager.abilities(this.monster)[ this.monster.abilities[ index + this.monster.ability + 1 ] ];
    gameManager.stateManager.before("removeAbility", "data.monster." + this.monster.name, this.abilityLabel(ability));
    this.monster.abilities.splice(index + this.monster.ability + 1, 1);
    gameManager.stateManager.after();
  }

  abilityLabel(ability: Ability): string {
    let label = 'data.monster.' + this.monster.name;
    if (ability?.name) {
      label = 'data.ability.' + ability.name;
    } else if (this.monster.deck != this.monster.name) {
      label = 'data.deck.' + this.monster.deck;
      if (label.split('.')[ label.split('.').length - 1 ] === settingsManager.getLabel(label) && this.monster.deck) {
        label = 'data.monster.' + this.monster.deck;
      }
    }

    return settingsManager.getLabel(label);
  }

  defaultSort() {
    this.monster.abilities = this.monster.abilities.sort((a, b) => a - b);
  }

  override open(): void {
    super.open();
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 250);
  }
}