<template>
  <span :tooltip="text"><slot /></span>
</template>

<script>
export default {
  name: "Tooltip",
  props: {
    text: {
      type: String,
      default: "Tooltip text",
    },
  },
};
</script>

<style lang="scss" scoped>
$gray: #495057;

// https://codepen.io/tutsplus/pen/WROvdG => tooltip source code
[tooltip] {
  // used for slot editing
  & > * {
    display: inline-block;
  }
  position: relative;
  &:before,
  &:after {
    text-transform: none; /* opinion 2 */
    font-size: 0.9em; /* opinion 3 */
    line-height: 1;
    user-select: none;
    pointer-events: none;
    position: absolute;
    display: none;
    opacity: 0;
  }
  &:before {
    content: "";
    border: 5px solid transparent; /* opinion 4 */
    z-index: 1001; /* absurdity 1 */
  }
  &:after {
    content: attr(tooltip); /* magic! */

    /* most of the rest of this is opinion */
    font-family: Helvetica, sans-serif;
    text-align: center;

    /*
    Let the content set the size of the tooltips
    but this will also keep them from being obnoxious
    */
    min-width: 3em;
    max-width: 21em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0.5rem;
    border-radius: 0.3rem;
    box-shadow: 0 1em 2em -0.5em rgba(0, 0, 0, 0.35);
    background: $gray;
    color: #fff;
    z-index: 1000; /* absurdity 2 */
  }
  &:hover:before,
  &:hover:after {
    display: block;
  }
  /* position: TOP */
  &:not([position]):before,
  &[position^="top"]:before {
    bottom: 100%;
    border-bottom-width: 0;
    border-top-color: $gray;
  }
  &:not([position]):after,
  &[position^="top"]::after {
    bottom: calc(100% + 5px);
  }

  &:not([position])::before,
  &:not([position])::after,
  &[position^="top"]::before,
  &[position^="top"]::after {
    left: 50%;
    transform: translate(-50%, -0.5em);
  }

  /* position: BOTTOM */
  &[position^="bottom"]::before {
    top: 105%;
    border-top-width: 0;
    border-bottom-color: $gray;
  }
  &[position^="bottom"]::after {
    top: calc(105% + 5px);
  }
  &[position^="bottom"]::before,
  &[position^="bottom"]::after {
    left: 50%;
    transform: translate(-50%, 0.5em);
  }

  /* position: LEFT */
  &[position^="left"]::before {
    top: 50%;
    border-right-width: 0;
    border-left-color: $gray;
    left: calc(0em - 5px);
    transform: translate(-0.5em, -50%);
  }
  &[position^="left"]::after {
    top: 50%;
    right: calc(100% + 5px);
    transform: translate(-0.5em, -50%);
  }

  /* position: RIGHT */
  &[position^="right"]::before {
    top: 50%;
    border-left-width: 0;
    border-right-color: $gray;
    right: calc(0em - 5px);
    transform: translate(0.5em, -50%);
  }
  &[position^="right"]::after {
    top: 50%;
    left: calc(100% + 5px);
    transform: translate(0.5em, -50%);
  }

  /* FX All The Things */
  &:not([position]):hover::before,
  &:not([position]):hover::after,
  &[position^="top"]:hover::before,
  &[position^="top"]:hover::after,
  &[position^="bottom"]:hover::before,
  &[position^="bottom"]:hover::after {
    animation: tooltips-vert 300ms ease-out forwards;
  }

  &[position^="left"]:hover::before,
  &[position^="left"]:hover::after,
  &[position^="right"]:hover::before,
  &[position^="right"]:hover::after {
    animation: tooltips-horz 300ms ease-out forwards;
  }
}

/* don't show empty tooltips */
[tooltip=""]::before,
[tooltip=""]::after {
  display: none !important;
}

/* KEYFRAMES */
@keyframes tooltips-vert {
  to {
    opacity: 0.9;
    transform: translate(-50%, 0);
  }
}

@keyframes tooltips-horz {
  to {
    opacity: 0.9;
    transform: translate(0, -50%);
  }
}
</style>
