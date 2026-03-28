import React, { Component } from 'react';
import { environment } from '#store/environment';
import { workspace } from '#store/workspace';
import { spriteState } from './state';
import { observer } from 'mobx-react';
import { Sprite } from './sprite';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Slider } from '#ui';
import {
    baseSize,
    margin,
} from 'sass-variables';
import { scrollbarWidth } from 'sass-variables';
import { DimensionsComponent } from '#util/dimensions-component';

const realBaseSize = parseInt(baseSize) + parseInt(margin) * 2;

const SortableItem = SortableElement(
    observer(
        class extends Component {
            render() {
                const {
                    value,
                    bbox: { x, y },
                } = this.props;

                return (
                    <div
                        className="bbox"
                        style={{
                            left: x || 0,
                            top: y || 0,
                        }}
                    >
                        <Sprite data={value} />
                    </div>
                );
            }
        },
    ),
);

const SortableItemFast = SortableElement(({ bbox: { x, y } }) => (
    <div
        className="bbox"
        style={{
            left: x || 0,
            top: y || 0,
            width: realBaseSize,
            height: realBaseSize,
        }}
    />
));

const SortableList = SortableContainer(
    observer(class extends Component {
        render() {
            const { items, width, height, scroll } = this.props;

            const realWidth = width - parseInt(scrollbarWidth) - 2;
            const realItemsPerRow = Math.floor(realWidth / realBaseSize);
            const itemsPerRow = Math.max(1, realItemsPerRow);
            let rowCount = Math.ceil(items.length / itemsPerRow);
            const remainder = !realItemsPerRow ? 0 : (realWidth % realBaseSize) / 2;

            const baseIndex = (0 | (scroll / realBaseSize)) * itemsPerRow;
            const itemQty = itemsPerRow * (height / realBaseSize) + itemsPerRow * 2;

            let itemss = [];
            let only_display_sprite = '';
            if (workspace.project != null && workspace.project.nodeRef != null && (workspace.project.nodeRef.mappings.only_display_sprite) ) {
                only_display_sprite = workspace.project.nodeRef.mappings.only_display_sprite;
                if(only_display_sprite !== '') {
                    only_display_sprite = parseInt(only_display_sprite);
                    if(!isNaN(only_display_sprite)) {
                        if (only_display_sprite < 0 || only_display_sprite >= items.length) {
                            only_display_sprite = '';
                        }
                    } else {
                        only_display_sprite = '';
                    }
                } else {
                    only_display_sprite = '';
                }
            }

            if (only_display_sprite !== '') {
                rowCount = 1;

                // This throws warnings into the Javascript console, but the thing I'm trying to implement seems to work anyway.
                // I am way out of my depth to know how to fix the warnings, so here it will stay. (I know very little Javascript, and even less React stuff.)
                environment.config.currentSprite = only_display_sprite;

                for (let i = 0; i < items.length; i++) {
                    if (i == only_display_sprite) {
                        itemss.push(items[i]);
                    }
                }
            } else {
                itemss = items;
            }

            return (
                <div
                    className="sprites"
                    style={{ height: rowCount * realBaseSize || 0 }}
                >
                    {itemss.map((value, index) => {
                        // calculate positions
                        const x = remainder + (index % itemsPerRow) * realBaseSize;
                        const y = (0 | (index / itemsPerRow)) * realBaseSize;
                        if (only_display_sprite != '') {
                            index = only_display_sprite;
                        }

                        if ((index >= baseIndex && index < baseIndex + itemQty) || only_display_sprite != '') {
                            return (
                                <SortableItem
                                    key={`sprite-${index}`}
                                    index={index}
                                    value={value}
                                    bbox={{ x, y }}
                                />
                            );
                        } else {
                            return (
                                <SortableItemFast
                                    key={`sprite-${index}`}
                                    index={index}
                                    bbox={{ x, y }}
                                />
                            );
                        }
                    })}
                </div>
            );
        }
    }),
    { withRef: true },
);

export const Sprites = observer(class Sprites extends DimensionsComponent {
    getContainer = () => {
        return document.querySelector('.spriteSortContainer');
    };

    onSortEnd = ({ oldIndex, newIndex }) => {
        environment.swapSprite(oldIndex, newIndex);
        environment.config.currentSprite = newIndex;
    };

    render() {
        const { sprites } = environment;
        const { width, height, scroll } = this.state;

        return (
            <div className="spriteList">
                <div className="spriteSortContainer" ref={this.onContainerRef}>
                    <SortableList
                        axis="xy"
                        helperClass="sortable-float-sprite"
                        onSortEnd={this.onSortEnd}
                        getContainer={this.getContainer}
                        items={sprites}
                        width={width}
                        height={height}
                        scroll={scroll}
                    />
                </div>
                <Slider
                    store={spriteState}
                    accessor="zoom"
                    min="1"
                    max="8"
                />
            </div>
        );
    }
});
