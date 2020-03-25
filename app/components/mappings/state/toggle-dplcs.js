import { environment } from '#store/environment';
import { mappingState } from './index';
import { optimizeDPLCs } from './optimize-dplcs';
import range from 'lodash/range';

export function toggleDPLCs() {

    const { sprites, config: { dplcsEnabled } } = environment;

    if (dplcsEnabled) {

        sprites.forEach(({mappings, dplcs}) => {
            // get list dplc tiles
            const dplcIndicies = [];
            dplcs.forEach(({art, size}) => {
                dplcIndicies.push(...range(art, art + size));
            });

            // update mapping art locations
            mappings.forEach((mapping) => {
                mapping.art = dplcIndicies[mapping.art];
            });

        });

        environment.dplcs.replace([]);
        environment.config.dplcsEnabled = false;
    }
    else {
        let newDPLCList = [];

        sprites.forEach(({mappings}) => {

            let newDPLCs = [];
            let dplcIndex = 0;
            mappings.forEach((mapping) => {

                const tileSize = mapping.width * mapping.height;
                const existingIndex = newDPLCs.findIndex(({art, size}) => (
                    art == mapping.art && size >= tileSize
                ));

                newDPLCs.push({
                    art: mapping.art,
                    size: tileSize,
                });

                mapping.art = dplcIndex;
                dplcIndex += tileSize;

            });

            newDPLCList.push(newDPLCs);

        });

        environment.dplcs.replace(newDPLCList);
        environment.config.dplcsEnabled = true;

        // optimize & dedupe
        const { mappings, dplcs } = environment;
        for (let i = 0; i < mappings.length; i++) {
            optimizeDPLCs(mappings[i], dplcs[i]);
        }

    }

}
