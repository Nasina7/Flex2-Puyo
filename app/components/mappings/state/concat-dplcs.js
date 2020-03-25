import { environment } from '#store/environment';
import range from 'lodash/range';

export function concatDPLCs(dplcs) {

    let newDPLCs = [];

    let tiles = [];

    dplcs.forEach(({art, size}) => {
        tiles.push(...range(art, art+size));
    });

    let obj = {};

    tiles.forEach((num) => {
        if (typeof obj.art == 'undefined') {
            obj.art = num;
            obj.size = 1;
        }
        else if (obj.size == 16 || obj.art + obj.size != num) {
            newDPLCs.push(obj);
            obj = {
                art: num,
                size: 1,
            };
        }
        else {
            obj.size++;
        }
    });
    if (typeof obj.art != 'undefined') {
        newDPLCs.push(obj);
    }

    return newDPLCs;
}
