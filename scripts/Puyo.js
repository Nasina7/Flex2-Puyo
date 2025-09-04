// Flex 2 Mapping Definition - Puyo Puyo / Mean Bean Machine

const {
  mappings,
  dplcs,
  offsetTable,
  write,
  read,
  dc,
  nybble,
  endFrame,
  skipFrame,
  signed,
  asm,
} = Flex2;

mappings([
  offsetTable(dc.l),
  [
    () => {
      const quantity = read(dc.w);
      return (
        quantity > 0 &&
        (({ mapping }, frameIndex) => {
          mapping.top = read(dc.w, signed);
          read(nybble);
          mapping.width = read(2) + 1;
          mapping.height = read(2) + 1;
          mapping.link = read(dc.b);
          mapping.priority = read(1);
          mapping.palette = read(2);
          mapping.vflip = read(1);
          mapping.hflip = read(1);
          mapping.art = read(11);
          mapping.left = read(dc.w, signed);
          if (frameIndex === quantity - 1) return endFrame;
        })
      );
    },
    ({ sprite }) => {
      write(dc.w, sprite.length);
      return ({ mapping }) => {
        write(dc.w, mapping.top);
        write(nybble, 0);
        write(2, mapping.width - 1);
        write(2, mapping.height - 1);
        write(dc.b, mapping.link);
        write(1, mapping.priority);
        write(2, mapping.palette);
        write(1, mapping.vflip);
        write(1, mapping.hflip);
        write(11, mapping.art);
        write(dc.w, mapping.left);
      };
    },
  ],
]);

asm(({ addScript, importScript, writeMappings, writeDPLCs }) => {
  importScript("MapMacros.asm");

  writeMappings(({ label, sprites, renderHex }) => {
    const list = [];

    list.push(`${label}: mappingsTable`);
    sprites.forEach((_, i) => {
      list.push(`\tmappingsTableEntry.l\t${label}_${i}`);
    });
    list.push("");

    sprites.forEach((sprite, i) => {
      list.push(`${label}_${i}:\tspriteHeader`);

      sprite.mappings.forEach((mapping) => {
        const pieceInfo = [
          mapping.left,
          mapping.top,
          mapping.width,
          mapping.height,
          mapping.art + sprites.tile_offset,
          mapping.hflip,
          mapping.vflip,
          mapping.palette,
          mapping.priority,
          mapping.link,
        ]
          .map(renderHex)
          .join(", ");

        list.push(` spritePiece ${pieceInfo}`);
      });

      list.push(`${label}_${i}_End`);
      list.push("");
    });

    list.push("\teven");

    return list.join("\n");
  });
});
