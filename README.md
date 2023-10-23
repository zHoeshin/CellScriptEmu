# CellScript
**A scripting language for describing cellular automatas**

## Defining an Element
**Element - a type of cell that can interract with the world**

To define an element, keyword `element` is used.

Default syntax is shown below:
```
element ELEMENTNAME {
    color #000000;

    rules {
        ...
    }
}

```

Color can be any value of type `#RRGGBB`

## Rules and conditions

To define rules, you use conditional and actional statements.

Conditions are defined with keywords `if` and `ifnot` followed by a condition:

```
if (NUMBER) TYPE at DIRECTION {...}
```

`NUMBER` can be an integer or an inclusive range (`[a..b]`).

`TYPE` is the type of cell you check for.

`DIRECTION` can be an integer for specific neighbors cells or a built-in `DIR` constant

Conditional statements check if there are `NUMBER` of `TYPE` type cells at neighbor cells mapped by `DIR`.

Conditional statement can be followed by a one-line instruction or by another conditional statement inside of a `{block}`.

## Actions

Action statements are result of conditional statements.

Currently the only actional statement is `=>`:

```
=> TYPE
```

This statement turns a cell into `TYPE` type cell.

The statement can be defined outside a conditional instruction:

```
rules {
    => TYPE
}
```

## DIR patterns

The `DIR` constant defines which neighbor cells are being checked in a conditional statement.

`DIR` can take values of `UP`, `DOWN`, `LEFT`, `RIGHT` (`DIR.UP`) and various combinations of those for corner neighbor cells (`DIR.UPLEFT`).

Also `DIR` takes values of `CROSS`, `X` (`DIR.CROSS`) for checking only corner neighbor cells and `PLUS` (`DIR.PLUS`) for checking all non-corner neighbor cells.

For checking all the cells aroung use `DIR.ALL` or `DIR.ANY`.