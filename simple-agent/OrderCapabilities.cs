using XiansAi.Flow.Router.Plugins;
using System.Collections.Generic;

public class OrderItem
{
    public required string sku { get; set; }
    public required string name { get; set; }
    public required int quantity { get; set; }
    public required double price { get; set; }
}

public static class OrderCapabilities
{
    [Capability("List ERP orders")]
    [Parameter("count", "Number of orders to list (default: 5)")]
    [Returns("List of recent ERP orders")]
    public static List<object> ListOrders(int count = 5)
    {
        var orders = new List<object>
        {
            new { orderId = "ORD001", customer = "Acme Corp", status = "Processing", total = 1200.50 },
            new { orderId = "ORD002", customer = "Beta Ltd", status = "Shipped", total = 850.00 }
        };
        return orders;
    }

    [Capability("Get ERP order details")]
    [Parameter("orderId", "The ID of the order to retrieve")]
    [Returns("Order details for the specified order ID")]
    public static object GetOrderDetails(string orderId)
    {
        return new {
            orderId = orderId,
            customer = "Acme Corp",
            status = "Processing",
            items = new List<OrderItem> {
                new OrderItem { sku = "SKU123", name = "Widget", quantity = 10, price = 50.00 },
                new OrderItem { sku = "SKU456", name = "Gadget", quantity = 5, price = 100.10 }
            },
            total = 1200.50
        };
    }

    [Capability("Create a new ERP order")]
    [Parameter("customer", "Customer name")]
    [Parameter("items", "List of order items")]
    [Returns("Confirmation of created order with order ID")]
    public static object CreateOrder(string customer, List<OrderItem> items)
    {
        return new {
            orderId = "ORD003",
            customer = customer,
            status = "Created",
            items = items,
            total = 999.99
        };
    }
}
