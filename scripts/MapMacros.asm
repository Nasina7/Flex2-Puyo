; macro to declare a mappings table (taken from Sonic 2 Hg disassembly)
mappingsTable macro {INTLABEL}
__LABEL__ label *
.current_mappings_table := __LABEL__
    endm

; macro to declare an entry in a mappings table (taken from Sonic 2 Hg disassembly)
mappingsTableEntry macro ptr
	dc.ATTRIBUTE ptr
    endm

spriteHeader macro {INTLABEL}
__LABEL__ label *
	dc.w ((__LABEL___End - __LABEL___Begin) / 8)
__LABEL___Begin label *
    endm

spritePiece macro xpos,ypos,width,height,tile,xflip,yflip,pal,pri,lnk
	dc.w	ypos
	dc.b	(((width-1)&3)<<2)|((height-1)&3)
	dc.b	lnk
	dc.b	((pri&1)<<7)|((pal&3)<<5)|((yflip&1)<<4)|((xflip&1)<<3)|((tile&$700)>>8)
	dc.b	tile&$FF
	dc.w	xpos
	endm
