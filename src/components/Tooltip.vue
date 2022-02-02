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

[tooltip] {
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

  /* position: BOTTOM */
  &::before {
    top: 105%;
    border-top-width: 0;
    border-bottom-color: $gray;
  }
  &::after {
    top: calc(105% + 5px);
  }
  &::before,
  &::after {
    left: 50%;
    transform: translate(-50%, 0.5em);
  }

  /* FX All The Things */
  &:hover::before,
  &:hover::after {
    animation: tooltips-vert 300ms ease-out forwards;
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
