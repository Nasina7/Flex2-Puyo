export function getSpriteBBoxes(buffer, width, height, fuzziness = 0) {

    const clone = new ImageData(
        Uint8ClampedArray.from(buffer.data),
        width,
        height,
    );

    const bboxes = [];

    // tracking the offset seems to give a 5x perf boost

    ~function loop(startOffset = 0) {
        const nextSprite = getSprite(clone, width, height, fuzziness, startOffset);
        if (nextSprite != -1) {
            if (nextSprite.width > 0 && nextSprite.height > 0) {
                bboxes.push(nextSprite);
            }
            loop(nextSprite.firstPos);
            delete nextSprite.firstPos;
        }
    } ();

    // sort bboxes into rows
    const mutBBoxes = [...bboxes];
    const rows = [];
    while (mutBBoxes.length) {
        const highest = mutBBoxes.reduce((a, b) => a.y < b.y ? a : b);
        const row = mutBBoxes.filter((d) => d.y < highest.y + highest.height);
        const left = row.reduce((a, b) => a.x < b.x ? a : b);
        const index = mutBBoxes.findIndex((d) => d === left);
        rows.push(mutBBoxes.splice(index, 1)[0]);
    }

    return rows;
}

export function getSprite(buffer, width, height, fuzziness = 0, startOffset = 0) {

    function getXY(pos) {
        const x = (pos / 4) % width;
        const y = (((pos / 4) - x) / width);
        return { x, y };
    }

    function getPos(x, y) {
        return ((y * width) + x) * 4;
    }

    function setPixel(pos) {
        buffer.data[pos+3] = 0;
        // track bbox
        const { x, y } = getXY(pos);
        bbox.minX = Math.min(x, bbox.minX);
        bbox.maxX = Math.max(x, bbox.maxX);
        bbox.minY = Math.min(y, bbox.minY);
        bbox.maxY = Math.max(y, bbox.maxY);
    }

    function checkMatch(pos) {
        const { x, y } = getXY(pos);
        if (x < 0 || y < 0 || x >= width || y >= height) return true;
        return buffer.data[pos+3] !== 0;
    }

    function floodSprite(x, y) {

        let stack = [[x, y]];

        while (stack.length) {
            let reachLeft, reachRight;
            let [x, y] = stack.pop();
            let pos = getPos(x, y);

            while (y-- >= 0 && checkMatch(pos)) {
                pos -= width * 4;
            }

            pos += width * 4;
            ++y;
            reachLeft = false;
            reachRight = false;

            if (stack.length > 1000000) return;

            while (y++ < height - 1 && checkMatch(pos)) {
                setPixel(pos);

                if (x > 0) {
                    if (checkMatch(pos-4)) {
                        if (!reachLeft) {
                            stack.push([x - 1, y]);
                            reachLeft = true;
                        }
                    }
                    else if (reachLeft) {
                        reachLeft = false;
                    }
                }

                if (x < width - 1) {
                    if (checkMatch(pos+4)) {
                        if (!reachRight) {
                            stack.push([x + 1, y]);
                            reachRight = true;
                        }
                    }
                    else if (reachRight) {
                        reachRight = false;
                    }
                }

                pos += width * 4;
            }

        }

    }

    // get first pixel
    let firstPos = -1;

    for (let j = startOffset; j < buffer.data.length; j+=4) {
        if (buffer.data[j+3] > 0x80) {
            firstPos = j;
            break;
        }
    }

    // if no pixels found...
    if (firstPos == -1) return -1;

    let { x, y } = getXY(firstPos);

    let bbox = { minX: x, maxX: x, minY: y, maxY: y};

    floodSprite(x, y);

    // if search is fuzzy
    if (fuzziness > 0) {

        let foundNext;

        do {
            foundNext = false;

            // get expanded bbox
            let minX = bbox.minX - fuzziness;
            let maxX = bbox.maxX + (fuzziness*2);
            let minY = bbox.minY - fuzziness;
            let maxY = bbox.maxY + (fuzziness*2);

            // search for another pixel
            for (let x = minX; x < maxX; x++) {
                for (let y = minY; y < maxY; y++) {
                    const nextPos = getPos(x, y);

                    if (buffer.data[nextPos+3] > 0x80) {
                        foundNext = true;
                        floodSprite(x, y);
                        break;
                    }
                }
            }
        }
        while (foundNext);
    }

    return {
        x: bbox.minX,
        y: bbox.minY,
        width: bbox.maxX - bbox.minX + 1,
        height: bbox.maxY - bbox.minY + 1,
        firstPos,
    };

}
