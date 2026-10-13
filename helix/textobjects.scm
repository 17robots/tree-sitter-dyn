(fn) @function.around
(fn (block) @function.inside)
[(struct) (enum)] @class.around
(block) @block.around
(if_) @conditional.around
(for_) @loop.around
(fn_param) @parameter.inside
(call call_args: (_) @parameter.inside)
(comment) @comment.around
[(declaration) (struct_member) (enum_member)] @entry.around
