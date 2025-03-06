(fn (_) @function.inside) @function.around
(struct (_) @class.inside) @class.around
(enum (_) @class.inside) @class.around
(error (_) @class.inside) @class.around
(comment) @comment.inside
(comment)+ @comment.around
