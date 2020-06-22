# dls-icons-vue

## Installation

```shell
npm i -D dls-icons-vue
```

## Usage

```vue
<template>
<div className="title">
  <h1>
    Hello Icons
    <icon-arrow-right style="{ color: '#999', marginLeft: '5px' }" />
  </h1>
</div>
</template>

<script>
import { IconArrowRight } from 'dls-icons-vue'

export default function Title() {
  components: {
    IconArrowRight
  }
}
</script>
```

## Available Icons

{iconTable}
