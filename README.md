# Using Generator Functions in Algorithm Visualizations

Web pages are particurarly suited for course materials about programming. The usual text and image based multimedia content can be 
accompanied by automatically generated visualizations. As the browser platform is itself programmable, the visualizations shown by 
the browser can be interactive.

However, the browser platform is inherently event-driven. That requires the developer to reformulate the algorithms to be presented 
in an unusual manner, usually by converting the structured program code to a state machine. This is time-consuming and 
error-prone work.

Generator functions can be used very effectively to implement algorith visualizations in JavaScript. The ability to suspend and 
resume execution of a function allows one to implement the visualization with the same control structure as the algorithm itself to 
be visualized. Also the algorithm is running directly inside the browser, thereby it has access to the DOM.

## Problem: Preserving State in an Asynchronous Environment

The asynchronous, event-driven nature of web applications is problematic with respect to the constraint of the animation algorithm 
having the same control structure as the algorithm that it presents.

Consider the simple loop below. The task is to create a debugging-like behavior, where the loop is paused before each iteration, in 
order to explain to the students how the value of the loop variable is compared to the limit.

```javascript
let i = 1;

while (i <= 10) {
    console.log(i);
    i += 1;
}
```

The next code snippet shows how the source code behind visualization should ideally look like. It should have an identical control 
structure, with some 'wait here for the next mouse click' instructions inserted, which enable the instructor to explain what is 
happening.

```javascript
let i = 1;
wait_for_click();
while (i <= 10) {
    print(i);
    wait_for_click();
    i += 1;
    wait_for_click();
}
```

However, in an event-driven environment, the control is inverted. One does not simply call a function to wait for the click of a 
button, but rather a callback function is bound to the mouse click event. The loop of the source code cannot be inside the body of 
the click handler, because it would restart counting on each invocation of the function, ie. on each mouse click. Also we must not 
return from inside the loop, otherwise the state, the value of the `i` variable would be lost.

Note that by referring to the state of the loop, we also refer to information which is only stored in the execution environment: 
the instruction that is currently executed. This state cannot be accessed in any way from the code (at least not in a language 
which does not support continuations. If we break the loop, we lose the state. Any attempt to implement the wait for the next click 
will fail, as the click handler must return, and cannot call the above code snippet as a function either.

There are several partial solutions to the problem, but with conventional elements of structured programming, each has its own 
disadvantages.

Any algorithm can be represented as a *state machine*. In this application, each mouse click would instruct the state machine to 
execute the next set of instructions and make the transition to the next state. The states and transitions of the automaton would 
be equivalent to the control flow graph of the algorithm, with extra states added where a mouse click is expected. This automaton 
might be coded in different ways. One approach is to implement a class which represents the state machine, with its attributes 
being the local variables of the original code and the state variable itself. The problem with this approach is that it is tedious 
and error-prone work for the author to convert the algorithms to state machines.

One might also *record the events* of the animation. An elegant but incomplete solution is the use of closures to store visual 
effects of the animation.

```javascript
let events = [];
let i = 1;
while (i <= 10) {
    events.push(function(i) {
        console.log(i);
    }.bind(null, i));
    i += 1;
}
```

The idea is similar to recording the steps of the animation as a video, and then playing it back frame by
frame.

```javascript
let step = 0;
button.addEventListener('click',
  function() {
    if (step < events.length) {
        events[step]();
        step += 1;
    }
  });
```

This has a clear advantage compared to the previous solution regarding the complexity of the algorithm: the control structure is 
the same as the original, it is a simple loop. It could be easily adapted to recursive functions as well. The disadvantage however 
is that all interactivity is lost. If the algorithm to be presented requires some input while it is running (for example reading 
the limit of the loop from the keyboard), its output cannot be determined in advance.

## Solution: Using Generator Functions as Animation Timers

The 2015 version of JavaScript defines the notion of *generators*. A generator function is a special function capable of yielding 
many values. Instead of having `return` statements, these use the keyword `yield` to 'send' a value to their caller. Contrary to 
normal returning, yielding a value does not stop the execution of the function, rather it is only suspended. Therefore its state, 
local variables are preserved in the running environment, and execution can be resumed later. The next code snippet shows a 
generator function that yields an infinite stream of Fibonacci numbers.

```javascript
function* infinite_fibonacci() {
    let current = 0, next = 1;
    while (true) {
        yield current;
        let temp = current + next;
        current = next;
        next = temp;
    }
}

let gen = infinite_fibonacci();
for (let i = 1; i <= 10; ++i)
    print(gen.next().value);
```

The `yield` statement can be used to suspend an algorithm and resume it later. In the animation application, the animation 
algorithm itself will be a generator function. At each state when the animation is to be stopped to wait for a click, a `yield` 
statement must be inserted into the code. This will pause the execution of the algorithm until it is resumed by the following 
`next` method call of the instantiated generator. The snippet below shows how this can be implemented in JavaScript. Note that the 
animation is not prerecorded, so it can be interactive as well - it can even input data from the user while it is running.

The generator function:

```javascript
function* simple_loop() {
    let i = 1;
    yield false;
    while (i <= 10) {
        print(i);
        yield false;
        i += 1;
        yield false;
    }
    yield true;
}
```

Running the animation, step by step:

```javascript
let anim1 = simple_loop();
button.addEventListener('click',
  function() {
    anim1.next();
  });
```

Generators are able to send values to their caller via the `yield` statement. In our case, this can be used as a communication 
channel between the algorithm and the controlling environment. For example, yielding the value `false` might represent that the 
algorithm is still running, and `true` might tell the controller that the animation is finished, ie. there are no more steps. This 
can be used to stop the timer controlling the animation:

```javascript
let anim2 = simple_loop();
let timer = null;
function next() {
    if (gen.next().value)
        clearInterval(timer);
}
timer = setInterval(next, 350);
```

JavaScript also has a `yield*` keyword, which instantiates a generator, and calls its `next()` method until the generator is 
finished. Meanwhile it yields all the values the generator has yielded. This enables the author to use recursion in the animations. 
Below is and example of a tree traversal routine written in this style.

```javascript
function* traverse_tree(root) {
    if (root != null) {
        yield* traverse_tree(root.left);
        yield;
        yield* traverse_tree(root.right);
    }
}

yield* traverse_tree(root);
```

Using `yield*` in the recursive call creates a behavior that is well known as 'step into' in debuggers of integrated development 
environments. As all the values are passed to the caller, the animation controller will wait until the next click for each node of 
the tree. To create a 'step over' like behavior (for which the function call is executed completely, not step by step), one could 
simply instantiate the generator and call `next()` as many times as necessary, but without yielding anything.

## Examples

See the GitHub page at [https://czirkoszoltan.github.io/algorithm-visualization/](https://czirkoszoltan.github.io/algorithm-visualization/).
