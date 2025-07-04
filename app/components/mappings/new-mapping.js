import React, { Component } from 'react';
import chunk from 'lodash/chunk';
import { select, mouse } from 'd3-selection';
import { drag } from 'd3-drag';
import { mappingState } from './state';
import { environment } from '#store/environment';
import { observer } from 'mobx-react';
import { Mapping } from './mapping';
import { Checkbox, Button, Modal } from '#ui';

const baseConfig = {
    hflip: false,
    vflip: false,
    palette: 0,
    top: 0,
    left: 0,
    priority: false,
    link: 0,
};

const BottomMenu = observer(() => (
    <div className="row">
        <Button color="magenta" onClick={mappingState.toggleNewMapping}>
            Close
        </Button>
        <div className="autodismiss">
            <span onClick={mappingState.toggleAutodismiss}>autodismiss</span>
            <Checkbox
                checked={mappingState.autodismiss}
                onChange={mappingState.toggleAutodismiss}
            />
        </div>
    </div>
));

export const NewMapping = observer(
    class NewMapping extends Component {
        onRef = (node) => {
            this.node = node;
        };

        pos = [undefined, undefined];
        mapDefz = [];

        dragPlacementFactory = (index) => {
            return (node) => {
                if (node) {
                    select(node).call(
                        drag()
                            .filter(() => true)
                            .on('start', () => {
                                const { newMapping, scale } = mappingState;
                                const [x, y] = (this.pos = mouse(this.node));
                                const [pieceX, pieceY] = mouse(node);

                                newMapping.piece = Object.assign(
                                    {},
                                    this.mapDefz[index],
                                    {
                                        top: (y / scale - pieceY / 4) | 0,
                                        left: (x / scale - pieceX / 4) | 0,
                                    },
                                );
                            })
                            .on('drag', () => {
                                const {
                                    newMapping: { piece },
                                    scale,
                                } = mappingState;
                                const [x, y] = mouse(this.node);
                                const [dx, dy] = [
                                    x - this.pos[0],
                                    y - this.pos[1],
                                ];
                                this.pos = [x, y];

                                Object.assign(piece, {
                                    top: piece.top + dy / scale,
                                    left: piece.left + dx / scale,
                                });
                            })
                            .on('end', () => {
                                mappingState.placeNewMapping();
                            }),
                    );
                }
            };
        };

        getLeft = () => {
            const {
                newMapping: { active, piece },
            } = mappingState;
            if ((active && piece) || !active) return -325;
            else if (active) return 15;
        };

        getOpacity = () => {
            const {
                newMapping: { active },
            } = mappingState;
            return active ? 1 : 0;
        };

        render() {
            const {
                tiles,
                config: { currentTile },
            } = environment;
            const {
                scale,
                newMapping: { active, piece },
            } = mappingState;

            this.mapDefz = Array.from({ length: 0x10 }, (_, i) => ({
                art: currentTile,
                width: (i % 4) + 1,
                height: 0 | (i / 4 + 1),
                ...baseConfig,
            }));

            return (
                <div ref={this.onRef}>
                    {piece && (
                        <div className="new-floating-piece">
                            <Mapping
                                data={piece}
                                scale={mappingState.scale}
                                tileBuffer={tiles}
                            />
                        </div>
                    )}
                    <Modal
                        spring={{
                            left: this.getLeft(),
                            opacity: this.getOpacity(),
                        }}
                        className="new-mapping"
                    >
                        {chunk(this.mapDefz, 4).map((group, gIndex) => (
                            <div key={gIndex} className="group">
                                {group.map((def, lineIndex) => {
                                    const index = gIndex * 4 + lineIndex;
                                    const dragPlacement =
                                        this.dragPlacementFactory(index);
                                    return (
                                        <Mapping
                                            key={index}
                                            wrapRef={dragPlacement}
                                            data={def}
                                            scale={4}
                                            tileBuffer={tiles}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                        <BottomMenu />
                    </Modal>
                </div>
            );
        }
    },
);
