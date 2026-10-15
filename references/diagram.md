# Diagram mode

Some ideas are structure, not mechanism: a request path through services, a data pipeline, a permission hierarchy, a deploy flow. Forcing them into a machine strains the metaphor, and the reader has to decode the machine before they can read the idea. Diagram mode keeps the whole look (solids, four tones, painter's order, the card, calm motion, a true model) and replaces the invented object with a crafted map of the structure. Every rule here came from the first diagram figure, `examples/request-path/`: one GET request through eight blocks, which went through three layouts and a round of fixes before it read.

## Contents
1. When to use it
2. What carries over, what changes
3. The structure is the explanation
4. Vocabulary
5. Camera and layout
6. Labels and numbers
7. Tones and the lit state
8. Connections and packets
9. Motion and interaction
10. Verify
11. Anti-patterns

## 1. When to use it
- **The user asks for a diagram**, a flow, an architecture picture or a map of a system, or names boxes and lines.
- **The idea is relational.** It has several named parts, and what matters is how they connect, in what order and how long each takes: services and calls, stages of a pipeline, owners and permissions, a state machine.
- **A machine would need a key.** If the object you would invent needs a legend before the reader can map it back to the idea, the structure itself is clearer.

Stay in object mode when the idea has one mechanism that a real object performs: a cache key that skips work is still a pin-tumbler lock. When unsure, ask which one the user wants. Size it as in the main workflow, by nodes rather than parts: a **Figure** has 5–9 nodes (the request path has 8 nodes, 7 links, about 40 solids and 76 depth-sorted items), and a **Hero** has 10–16. Past about 16, split the idea into two figures; labels stop fitting long before the geometry does.

## 2. What carries over, what changes
Everything in `craft.md` and `verify.md` still holds unless this page replaces it: solids, not wireframes; the kit's shading; painter's order settled by `kit/audit.mjs`; halos; lines that end on something; nothing passing through anything; the card with Fig, title, hint and live readout; one true model driving every number; both themes; the line-end check, the audit and 4× close-ups.

What changes:

| Object mode | Diagram mode |
|---|---|
| The object is the explanation | The structure is the explanation: position, height, grouping and connection each mean something |
| Invent a machine, then a 40-part list | Write a mapping, then an inventory (section 3) |
| Detail from mechanism: screws, knurls, bushings | Detail from finish and function: bevels, top grooves, sockets, ferrules, seams, a floor grid, a ruler. No fasteners: a screw on an abstract block makes the reader look for the machine |
| At most one engraved label | Every node is named, on one face, in one size shrunk only to fit (section 6). Numbers sit on a scale |
| Exactly one `lit` accent | `lit` means working now, so concurrent work lights several parts (section 7) |
| Subject `hi`, structure `mid` | Nodes are peers and rest at `mid`; `hi` marks a result such as the critical path |

Still banned in the drawing: arrowheads, leader lines, balloons, floating text, dashed hidden edges and colour that isn't the subject. Direction comes from motion (section 8).

## 3. The structure is the explanation
Write the mapping before any geometry, as you would invent the object. Each visual property carries one true quantity or none:

| In the idea | In the figure (request path) |
|---|---|
| An entity | A node: a block for a service, a puck stack for a store, a distinct glyph for an outside actor |
| A relationship | A connection from a socket on one node to a socket on the other |
| A group or boundary | A raised tray under its nodes |
| A quantity per node | Block height: 8 + 2 units per ms of the node's own service time |
| Time | A ruler along the front edge, 6 units per ms, with a bar that grows as the request runs |
| State | A detail that changes: the cache's cells dim on a miss and light again when orders writes the row back |
| What is happening now | The `lit` state on working nodes, and packets on the connections |
| A derived result | `hi` outlines on the critical path once the request is done; pricing stays `mid` because inventory is the longer branch |

Then write the **inventory**: each node with its glyph, size and quantity; each connection with its two sockets; each group; the scale. Put the model in a pure module (`model.mjs`): `requestPlan(config)` returns every work interval and every hop, and the readout, the bar, the lit states, the packets, the heights, the critical path and the caption all read from it.

## 4. Vocabulary
All of these are plain kit calls; `examples/request-path/build.mjs` has each in working form.

- **Service block.** `slabOf` with `r` 3, bevel 0.8, tone `mid`, a `planOutline` groove inset 3.2 on top (`faint`) and the name on its front face.
- **Store.** `cylinder` with `sideArc` seams as the solid's `inner` (two for a database's platters, one for a cache) and a `faint` top ring. Its name goes on the top face, the one flat face a round glyph has.
- **Outside actor.** A lower block in another shape language: the client is 9 tall on the bare plate with a screen outline on top.
- **Group.** A tray, `slabOf` 2 high, tone `mid`, inset groove, its members standing on it. A group with no clear corner for its name (section 6) is named in the legend instead.
- **Ground.** One plate, `lo`, bevel 1.6, a groove inset 4, a `faint` dot grid every 20 units and a halo. No feet: feet make it furniture.
- **Socket.** A 6 × 6 slab 1.4 proud of the node's face, centred on the connection's height; on a round store, a short boss `disc` along the face normal starting at `sqrt(R² − r²)` (rim on the curved surface).
- **Connection.** A tube at a fixed height (`TUBE_Z` 7, `r` 1.4) from socket to socket, with a ferrule `disc` (length 1.2, `r` 2.2) on each end, owned by the route, and the tube gapped under it.
- **Scale.** A ruler strip with minor ticks every unit and majors every fifth, rooted on the strip's front edge, numbers on the plate's front face below them (section 6).
- **Timeline bar.** Thin slabs on the strip, one per work interval, in lanes: a full lane for sequential work, two half lanes while two branches run in parallel. A gap between segments is network time, so the bar shows what the critical path costs and where.

## 5. Camera and layout
- **Run the main flow along +x, and turn the camera to azimuth 55–60°.** The x axis then runs nearly flat across a landscape card and the +y faces turn toward the reader. At azimuth 40° the same plate ran diagonally, its corners took the card's width, and the blocks were 36 px across.
- **Elevation 30–36°.** The request path uses 34. Higher shows more of the tops, lower shows more of the labelled fronts.
- **Branches go back, never forward.** A side call (auth behind gateway, cache and db behind orders) sits in a row behind the main flow, so nothing stands in front of a labelled face. A fan-out pair splits across the rows with the shorter block in front: pricing (16 tall) in front, inventory (22) behind.
- **Rows far enough apart to see over.** A block of height `h` in front hides the face behind it unless the depth gap between them is about `h · cos E / (sin A · sin E)`, which is 1.75 h at azimuth 58° and elevation 34°. The label sits at mid-height, so a little less passes; check it in the capture. The first layout put pricing 15 units in front of inventory and the label read `…entory`.
- **Fit the plate to the content.** Size the ground plate to the nodes, the trays and the scale, then fit the projection. The first plate was 320 × 204 for content that needed 256 × 130, and the scale fell to 1.19.
- **Snap to a grid.** Node centres on columns 45–60 apart and rows 55 apart keep every connection a straight leg or one or two clean bends.

## 6. Labels and numbers
- **Big enough at 1×.** Label size in world units times `P.scale` must be at least about 6.5 viewBox units, roughly 7 CSS px on a 650 px card. The request path uses 4.4 at scale 1.50. Fit long names to their face (`fitText`: size ≤ face width / (characters × 0.62)), as `inventory` is.
- **One face per node, the face that points at the reader.** With the camera above, that is the +y face, set with `sideMatrix([x, faceY], zBaseline, P, "left")`. Front faces stay unsquashed; text on a top face is squashed by `sin E`, so it is only for glyphs with no flat side, such as stores.
- **A face carries the label or the sockets, not both.** The gateway-to-auth tube landed on the middle of auth's front face and covered the label (`a▯h`). Move the socket off the label's span, or the label off the socket's (`labelAt`).
- **Floor text hides behind raised lines.** A tube at height `z` covers the floor band about `z / tan E` behind it on screen. The `data` tray's name sat behind the orders-to-db tube until the tray grew a corner no line crosses. Choose that corner first, or name the group in the legend.
- **Numbers on the plane of their ticks.** The ruler's numbers on the plate's front face read as skewed, about 16 units in front of ticks rooted on the strip's back edge. Root the ticks on the strip's front edge and keep the strip within 2 units of the plate's edge, so each number sits under its tick.
- **Phones.** At 390 px wide the same labels are about 4 px, even with the card's 114% stretch: structure reads but names don't. Either cap the figure at about 6 nodes with larger labels, or ship a separate phone build with fewer nodes. The request path has not solved this.

## 7. Tones and the lit state
- **Nodes rest at `mid`.** They are peers. Built at `hi` like an object-mode subject, every block already had the darkest outline the kit draws, and the `lit` accent vanished: at 0.6 px the two are hard to tell apart (`#26262a` against `#000` in light, `#d4d4d4` against `#fff` in dark, where every block looked lit), and in light the lit top is the same white as the plain one.
- **Three weights.** `mid` 0.6 px for idle, `hi` 0.6 px for a result (the critical path after a request), `lit` 1.25 px for working now. In page CSS: `.it[data-crit]>.iso-solid>.iso-edge{stroke:var(--anatomy-hi)}` and `.it[data-node]>.iso-solid[data-lit]>.iso-edge{stroke:var(--anatomy-lit);stroke-width:1.25}`.
- **Lit is a fact from the model.** A node is lit while one of its work intervals contains `t`; during a fan-out two are, and during a write-back three parts are. Waiting is not working: orders is unlit while it waits on inventory.
- **Show results at rest.** After the request, the critical path is `hi` and everything off it stays `mid`, so the still frame explains the figure without the motion.

## 8. Connections and packets
- **Route like pipes.** Straight legs between sockets, `G.fillet` at 2.6 r, one tube per relationship, ports on the faces the connection leaves from. Incoming connections land on faces turned away from the camera when the flow runs along +x; that reads well, since the tube visibly enters the block.
- **Record them as tubes from the first build.** `R.route(name, route, r, { gaps, rims: [FER_R, FER_R] })`, the chunks with `A.tube`, the sockets, bosses and ferrules as recorded solids, then `A.settle` and `A.auditOrExit`. On its first run the request path failed only the stand-in check (the head circles below) and passed everything else: clearance, terminals (every connection ends on a socket), supports, depth order and crowding. On a diagram the audit takes under a second.
- **Direction is motion, not arrowheads.** A packet is a short `lit` trail and a head dot moving along the tube. Draw both inside each chunk's own item, so they are depth-sorted with the tube: a trail `<path pathLength>` on the chunk's screen centreline, whose `stroke-dasharray` and `stroke-dashoffset` show the part of the window `[s − trail, s]` that falls in `[from, to]`, and one head circle shown in the chunk that holds `s`. Give the head an initial position on its chunk: one left at `0,0` widened every chunk's drawing to the card's corner, and the audit's stand-in check failed 45 chunks.
- **A response travels back on the same tube.** Use `dir: -1` in the model and run `s` from the route's end to its start.

## 9. Motion and interaction
- **Run the model's timeline.** One clock in model units (ms), scaled to screen time (0.22 s per ms), with the request's legs to and from the client drawn but kept off the clock.
- **The tour cycles the inputs** the reader can change: hit and parallel, miss and parallel, miss in turn, hit in turn, with 1.6 s of rest on each result.
- **Inputs are keys and the node that owns the state.** Space sends, C toggles the cache, P toggles the fan-out; a click on the cache or db toggles the cache, on inventory or pricing the fan-out, anywhere else sends. Name the keys in the hint.
- **The readout follows the work.** `auth · 2.5 ms`, `network · 7.3 ms`, `inventory + pricing · 9.0 ms`, then the result, `cache miss · in turn · 30.6 ms`. The live region gets the result only.
- **Reduced motion jumps to the result**, with the full bar and the critical path.

## 10. Verify
Everything in `verify.md`, plus:
- **Every label in every pose.** Look at each label at 4× at rest and while lit; none is covered by a socket, a tube or a block in front.
- **Text size.** Work out label size × `P.scale` for desktop and for 390 px, and say in the caption or to the user what doesn't read on a phone.
- **One frame per phase.** Freeze the moments the idea turns on (the fan-out, a cache miss) with `["until", …readout…]` and `["slow", 0.01]`, then a 2× shot. Phases shorter than the poll interval need a numeric test (`+t >= 16.2`), not a string match.

## 11. Anti-patterns
- **A block in front of another's label.** Pricing hid `inventory`. Split pairs across rows, shorter in front.
- **A socket on the label's span.** Auth's label read `a▯h`.
- **Floor text behind a raised line.** The `data` tray's name.
- **Numbers off the plane of their ticks.**
- **Every node at `hi`.** The lit state became invisible.
- **A plate bigger than the content, at a diagonal camera.** Blocks of 36 px and labels of 5 px.
- **Text on top faces at 30°.** Squashed to half height; keep it for round glyphs.
- **Arrowheads, leader lines and floating labels.** Still banned. If the reader needs a word that has no face to sit on, it belongs in the legend or the caption.
